"use strict";

const path = require("path");

function normalizeFilename(filename) {
  return filename.split(path.sep).join("/");
}

function isTargetFile(filename, directoryNames) {
  const normalizedFilename = normalizeFilename(filename || "");
  return directoryNames.some((directoryName) => normalizedFilename.includes(`/${directoryName}/`));
}

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegExp(pattern) {
  return new RegExp(`^${escapeRegExp(pattern).replace(/\*/g, ".*")}$`);
}

function matchesAnyPattern(value, patterns) {
  return Array.isArray(patterns) && patterns.some((pattern) => globToRegExp(pattern).test(value));
}

function getCalleeName(node) {
  if (!node) {
    return null;
  }

  if (node.type === "Identifier") {
    return node.name;
  }

  if (node.type === "MemberExpression" && !node.computed) {
    const objectName = getCalleeName(node.object);
    const propertyName = getCalleeName(node.property);
    if (objectName && propertyName) {
      return `${objectName}.${propertyName}`;
    }
  }

  return null;
}

function getFunctionInfoFromDeclaration(declaration) {
  if (!declaration) {
    return null;
  }

  if (declaration.type === "FunctionDeclaration" && declaration.id) {
    return {
      name: declaration.id.name,
      body: declaration.body,
      reportNode: declaration.id,
    };
  }

  if (
    declaration.type === "VariableDeclaration" &&
    declaration.declarations.length === 1 &&
    declaration.declarations[0].id.type === "Identifier"
  ) {
    const declarator = declaration.declarations[0];
    if (
      declarator.init &&
      (declarator.init.type === "ArrowFunctionExpression" || declarator.init.type === "FunctionExpression")
    ) {
      return {
        name: declarator.id.name,
        body: declarator.init.body,
        reportNode: declarator.id,
      };
    }
  }

  return null;
}

function walk(node, visit) {
  if (!node || typeof node !== "object") {
    return;
  }

  visit(node);

  for (const [key, value] of Object.entries(node)) {
    if (key === "parent") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item, visit);
      }
      continue;
    }

    walk(value, visit);
  }
}

function bodyContainsThrow(body) {
  let found = false;
  walk(body, (node) => {
    if (node.type === "ThrowStatement") {
      found = true;
    }
  });
  return found;
}

function bodyContainsResultReturn(body, resultCallPatterns) {
  if (body && body.type === "CallExpression") {
    const calleeName = getCalleeName(body.callee);
    return Boolean(calleeName && matchesAnyPattern(calleeName, resultCallPatterns));
  }

  let found = false;
  walk(body, (node) => {
    if (node.type !== "ReturnStatement" || !node.argument) {
      return;
    }

    if (node.argument.type !== "CallExpression") {
      return;
    }

    const calleeName = getCalleeName(node.argument.callee);
    if (calleeName && matchesAnyPattern(calleeName, resultCallPatterns)) {
      found = true;
    }
  });
  return found;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require explicit Result-style error handling in selected boundaries",
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
                directories: {
                  type: "array",
                  items: { type: "string" },
                },
                functionNamePatterns: {
                  type: "array",
                  items: { type: "string" },
                },
                resultCallPatterns: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["directories"],
            },
          },
        },
        required: ["targets"],
      },
    ],
    messages: {
      resultHandlingThrow:
        "Function '{{functionName}}' must not throw directly. Return a Result-style value instead.",
      missingResultReturn:
        "Function '{{functionName}}' must return a Result-style value such as {{resultPatterns}}.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const targets = Array.isArray(options.targets) ? options.targets : [];

    function validate(node, declaration) {
      const info = getFunctionInfoFromDeclaration(declaration);
      if (!info) {
        return;
      }

      for (const target of targets) {
        if (!isTargetFile(context.filename, target.directories || [])) {
          continue;
        }

        const functionNamePatterns = target.functionNamePatterns || ["*"];
        if (!matchesAnyPattern(info.name, functionNamePatterns)) {
          continue;
        }

        const resultCallPatterns = target.resultCallPatterns || ["Result.*", "ok", "err"];

        if (bodyContainsThrow(info.body)) {
          context.report({
            node: info.reportNode,
            messageId: "resultHandlingThrow",
            data: {
              functionName: info.name,
            },
          });
        }

        if (!bodyContainsResultReturn(info.body, resultCallPatterns)) {
          context.report({
            node: info.reportNode,
            messageId: "missingResultReturn",
            data: {
              functionName: info.name,
              resultPatterns: resultCallPatterns.join(", "),
            },
          });
        }
      }
    }

    return {
      ExportNamedDeclaration(node) {
        validate(node, node.declaration);
      },
      ExportDefaultDeclaration(node) {
        validate(node, node.declaration);
      },
    };
  },
};
