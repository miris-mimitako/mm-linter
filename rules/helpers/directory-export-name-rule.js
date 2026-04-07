"use strict";

const path = require("path");

function normalizeFilename(filename) {
  return filename.split(path.sep).join("/");
}

function isTargetDirectoryFile(filename, directoryName) {
  if (!filename || filename === "<input>") {
    return false;
  }

  return normalizeFilename(filename).includes(`/${directoryName}/`);
}

function inspectExportedDeclaration(context, declaration, isAllowedName, messageId, extraData = {}) {
  if (!declaration) {
    return;
  }

  if (declaration.type === "FunctionDeclaration" && declaration.id) {
    if (!isAllowedName(declaration.id.name)) {
      context.report({
        node: declaration.id,
        messageId,
        data: { ...extraData, name: declaration.id.name },
      });
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

    if (!isAllowedName(declarator.id.name)) {
      context.report({
        node: declarator.id,
        messageId,
        data: { ...extraData, name: declarator.id.name },
      });
    }
  }
}

function createDirectoryExportNameRule(config) {
  return {
    meta: {
      type: "suggestion",
      docs: {
        description: config.description,
      },
      schema: [],
      messages: {
        [config.messageId]: config.message,
      },
    },
    create(context) {
      if (!isTargetDirectoryFile(context.filename, config.directoryName)) {
        return {};
      }

      return {
        ExportNamedDeclaration(node) {
          inspectExportedDeclaration(context, node.declaration, config.isAllowedName, config.messageId);
        },
      };
    },
  };
}

module.exports = {
  createDirectoryExportNameRule,
  inspectExportedDeclaration,
  isTargetDirectoryFile,
};
