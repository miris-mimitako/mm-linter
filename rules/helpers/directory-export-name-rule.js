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

function reportInvalidName(context, node, messageId, extraData, name) {
  context.report({
    node,
    messageId,
    data: { ...extraData, name },
  });
}

function reportMissingName(context, node, missingNameMessageId, extraData) {
  if (!missingNameMessageId) {
    return;
  }

  context.report({
    node,
    messageId: missingNameMessageId,
    data: extraData,
  });
}

function isAllowedInitializer(node) {
  return (
    node &&
    (node.type === "ArrowFunctionExpression" ||
      node.type === "FunctionExpression" ||
      node.type === "ClassExpression")
  );
}

function inspectExportedDeclaration(
  context,
  declaration,
  isAllowedName,
  messageId,
  extraData = {},
  missingNameMessageId
) {
  if (!declaration) {
    return;
  }

  if (
    (declaration.type === "FunctionDeclaration" || declaration.type === "ClassDeclaration") &&
    declaration.id
  ) {
    if (!isAllowedName(declaration.id.name)) {
      reportInvalidName(context, declaration.id, messageId, extraData, declaration.id.name);
    }

    return;
  }

  if (declaration.type === "FunctionDeclaration" || declaration.type === "ClassDeclaration") {
    reportMissingName(context, declaration, missingNameMessageId, extraData);
    return;
  }

  if (declaration.type !== "VariableDeclaration" || declaration.kind !== "const") {
    return;
  }

  for (const declarator of declaration.declarations) {
    if (declarator.id.type !== "Identifier") {
      continue;
    }

    if (!isAllowedInitializer(declarator.init)) {
      continue;
    }

    if (!isAllowedName(declarator.id.name)) {
      reportInvalidName(context, declarator.id, messageId, extraData, declarator.id.name);
    }
  }
}

function createDirectoryExportNameRule(config) {
  const messages = {
    [config.messageId]: config.message,
  };

  if (config.missingNameMessageId) {
    messages[config.missingNameMessageId] =
      config.missingNameMessage ||
      "Default exported items in a {{directoryName}} directory must have a name that matches {{format}}.";
  }

  return {
    meta: {
      type: "suggestion",
      docs: {
        description: config.description,
      },
      schema: [],
      messages,
    },
    create(context) {
      if (!isTargetDirectoryFile(context.filename, config.directoryName)) {
        return {};
      }

      return {
        ExportNamedDeclaration(node) {
          inspectExportedDeclaration(
            context,
            node.declaration,
            config.isAllowedName,
            config.messageId,
            {
              directoryName: config.directoryName,
              format: config.format,
              subject: config.subject,
            },
            config.missingNameMessageId
          );
        },
        ExportDefaultDeclaration(node) {
          inspectExportedDeclaration(
            context,
            node.declaration,
            config.isAllowedName,
            config.messageId,
            {
              directoryName: config.directoryName,
              format: config.format,
              subject: config.subject,
            },
            config.missingNameMessageId
          );
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
