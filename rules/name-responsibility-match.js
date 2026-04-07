"use strict";

const path = require("path");

function normalizeFilename(filename) {
  return filename.split(path.sep).join("/");
}

function includesAnyDirectory(filename, directoryNames) {
  const normalized = normalizeFilename(filename);
  return directoryNames.some((directoryName) => normalized.includes(`/${directoryName}/`));
}

function getMethodNames(classBody) {
  return classBody.body
    .filter((member) => member.type === "MethodDefinition" && member.key.type === "Identifier")
    .map((member) => member.key.name);
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure names, directories, and required methods match responsibilities",
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
                suffix: { type: "string" },
                allowedDirectories: {
                  type: "array",
                  items: { type: "string" },
                },
                deniedDirectories: {
                  type: "array",
                  items: { type: "string" },
                },
                requiredMethods: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["suffix"],
            },
          },
        },
        required: ["targets"],
      },
    ],
    messages: {
      invalidResponsibilityDirectory:
        "'{{name}}' must be placed under one of: {{directories}}.",
      deniedResponsibilityDirectory:
        "'{{name}}' must not be placed under: {{directories}}.",
      missingResponsibilityMethod:
        "'{{name}}' must define method '{{methodName}}'.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const targets = Array.isArray(options.targets) ? options.targets : [];

    return {
      ClassDeclaration(node) {
        if (!node.id) {
          return;
        }

        for (const target of targets) {
          if (!node.id.name.endsWith(target.suffix)) {
            continue;
          }

          if (
            Array.isArray(target.allowedDirectories) &&
            target.allowedDirectories.length > 0 &&
            !includesAnyDirectory(context.filename, target.allowedDirectories)
          ) {
            context.report({
              node: node.id,
              messageId: "invalidResponsibilityDirectory",
              data: {
                name: node.id.name,
                directories: target.allowedDirectories.join(", "),
              },
            });
          }

          if (
            Array.isArray(target.deniedDirectories) &&
            target.deniedDirectories.length > 0 &&
            includesAnyDirectory(context.filename, target.deniedDirectories)
          ) {
            context.report({
              node: node.id,
              messageId: "deniedResponsibilityDirectory",
              data: {
                name: node.id.name,
                directories: target.deniedDirectories.join(", "),
              },
            });
          }

          const methodNames = getMethodNames(node.body);
          for (const requiredMethod of target.requiredMethods || []) {
            if (methodNames.includes(requiredMethod)) {
              continue;
            }

            context.report({
              node: node.id,
              messageId: "missingResponsibilityMethod",
              data: {
                name: node.id.name,
                methodName: requiredMethod,
              },
            });
          }
        }
      },
    };
  },
};
