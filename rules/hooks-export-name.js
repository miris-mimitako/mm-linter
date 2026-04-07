"use strict";

const path = require("path");

const HOOK_EXPORT_NAME_PATTERN = /^use[A-Z]/;

function normalizeFilename(filename) {
  return filename.split(path.sep).join("/");
}

function isHooksFile(filename) {
  if (!filename || filename === "<input>") {
    return false;
  }

  return normalizeFilename(filename).includes("/hooks/");
}

function isNamedHookExport(name) {
  return HOOK_EXPORT_NAME_PATTERN.test(name);
}

function reportInvalidName(context, node, name) {
  context.report({
    node,
    messageId: "invalidHookExportName",
    data: { name },
  });
}

function inspectExportedDeclaration(context, declaration) {
  if (!declaration) {
    return;
  }

  if (declaration.type === "FunctionDeclaration" && declaration.id) {
    if (!isNamedHookExport(declaration.id.name)) {
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

    if (!isNamedHookExport(declarator.id.name)) {
      reportInvalidName(context, declarator.id, declarator.id.name);
    }
  }
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require exported functions in hooks directories to use the useXxx naming convention",
    },
    schema: [],
    messages: {
      invalidHookExportName:
        "Exported hooks in a hooks directory must be named useXxx. '{{name}}' is not allowed.",
    },
  },
  create(context) {
    if (!isHooksFile(context.filename)) {
      return {};
    }

    return {
      ExportNamedDeclaration(node) {
        inspectExportedDeclaration(context, node.declaration);
      },
    };
  },
};
