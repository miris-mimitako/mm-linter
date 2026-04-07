"use strict";

const path = require("path");

const DTO_EXPORT_NAME_PATTERN = /Dto$/;

function normalizeFilename(filename) {
  return filename.split(path.sep).join("/");
}

function isDtoFile(filename) {
  if (!filename || filename === "<input>") {
    return false;
  }

  return normalizeFilename(filename).includes("/dto/");
}

function isNamedDtoExport(name) {
  return DTO_EXPORT_NAME_PATTERN.test(name);
}

function reportInvalidName(context, node, name) {
  context.report({
    node,
    messageId: "invalidDtoExportName",
    data: { name },
  });
}

function inspectExportedDeclaration(context, declaration) {
  if (!declaration) {
    return;
  }

  if (declaration.type === "FunctionDeclaration" && declaration.id) {
    if (!isNamedDtoExport(declaration.id.name)) {
      reportInvalidName(context, declaration.id, declaration.id.name);
    }

    return;
  }

  if (declaration.type !== "VariableDeclaration" || declaration.kind !== "const") {
    return;
  }

  for (const declarator of declaration.declarations) {
    if (declarator.id.type !== "Identifier") {
      continue;
    }

    if (!isNamedDtoExport(declarator.id.name)) {
      reportInvalidName(context, declarator.id, declarator.id.name);
    }
  }
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require exported functions in dto directories to use the XxxDto naming convention",
    },
    schema: [],
    messages: {
      invalidDtoExportName:
        "Exported DTO factories in a dto directory must be named XxxDto. '{{name}}' is not allowed.",
    },
  },
  create(context) {
    if (!isDtoFile(context.filename)) {
      return {};
    }

    return {
      ExportNamedDeclaration(node) {
        inspectExportedDeclaration(context, node.declaration);
      },
    };
  },
};
