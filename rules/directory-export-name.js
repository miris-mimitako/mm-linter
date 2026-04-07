"use strict";

const { isTargetDirectoryFile, inspectExportedDeclaration } = require("./helpers/directory-export-name-rule");

function buildMatcher(pattern) {
  return new RegExp(pattern);
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require exported functions in specific directories to follow configured naming patterns",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          targets: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                directoryName: { type: "string" },
                pattern: { type: "string" },
                format: { type: "string" },
                subject: { type: "string" },
              },
              required: ["directoryName", "pattern", "format"],
            },
          },
        },
        required: ["targets"],
      },
    ],
    messages: {
      invalidDirectoryExportName:
        "Exported {{subject}} in a {{directoryName}} directory must be named {{format}}. '{{name}}' is not allowed.",
      missingDirectoryExportName:
        "Default exported {{subject}} in a {{directoryName}} directory must have a name that matches {{format}}.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const targets = Array.isArray(options.targets) ? options.targets : [];

    return {
      ExportNamedDeclaration(node) {
        for (const target of targets) {
          if (!isTargetDirectoryFile(context.filename, target.directoryName)) {
            continue;
          }

          const matcher = buildMatcher(target.pattern);
          inspectExportedDeclaration(
            context,
            node.declaration,
            (name) => matcher.test(name),
            "invalidDirectoryExportName",
            {
              directoryName: target.directoryName,
              format: target.format,
              subject: target.subject || "functions",
            },
            "missingDirectoryExportName"
          );
        }
      },
      ExportDefaultDeclaration(node) {
        for (const target of targets) {
          if (!isTargetDirectoryFile(context.filename, target.directoryName)) {
            continue;
          }

          const matcher = buildMatcher(target.pattern);
          inspectExportedDeclaration(
            context,
            node.declaration,
            (name) => matcher.test(name),
            "invalidDirectoryExportName",
            {
              directoryName: target.directoryName,
              format: target.format,
              subject: target.subject || "functions",
            },
            "missingDirectoryExportName"
          );
        }
      },
    };
  },
};
