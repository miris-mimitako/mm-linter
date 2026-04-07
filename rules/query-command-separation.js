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

function bodyContainsMutation(body, mutationCallPatterns) {
  let found = false;

  walk(body, (node) => {
    if (node.type === "AssignmentExpression" || node.type === "UpdateExpression") {
      found = true;
      return;
    }

    if (node.type === "CallExpression") {
      const calleeName = getCalleeName(node.callee);
      if (calleeName && matchesAnyPattern(calleeName, mutationCallPatterns)) {
        found = true;
      }
    }
  });

  return found;
}

function bodyReturnsReadModel(body) {
  if (!body) {
    return false;
  }

  if (body.type === "ObjectExpression" || body.type === "ArrayExpression") {
    return true;
  }

  let found = false;
  walk(body, (node) => {
    if (
      node.type === "ReturnStatement" &&
      node.argument &&
      (node.argument.type === "ObjectExpression" || node.argument.type === "ArrayExpression")
    ) {
      found = true;
    }
  });
  return found;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce basic query/command separation constraints",
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
                queryNamePatterns: {
                  type: "array",
                  items: { type: "string" },
                },
                commandNamePatterns: {
                  type: "array",
                  items: { type: "string" },
                },
                mutationCallPatterns: {
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
      queryMustNotMutate:
        "Query '{{functionName}}' must not mutate state or call mutation APIs.",
      commandMustNotReturnReadModel:
        "Command '{{functionName}}' must not directly return an object or array read model.",
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

        const queryNamePatterns = target.queryNamePatterns || ["*Query", "get*", "find*", "load*"];
        const commandNamePatterns = target.commandNamePatterns || ["*Command", "execute*", "handle*"];
        const mutationCallPatterns =
          target.mutationCallPatterns || ["*.save*", "*.update*", "*.delete*", "*.insert*", "*.create*"];

        if (matchesAnyPattern(info.name, queryNamePatterns) && bodyContainsMutation(info.body, mutationCallPatterns)) {
          context.report({
            node: info.reportNode,
            messageId: "queryMustNotMutate",
            data: { functionName: info.name },
          });
        }

        if (matchesAnyPattern(info.name, commandNamePatterns) && bodyReturnsReadModel(info.body)) {
          context.report({
            node: info.reportNode,
            messageId: "commandMustNotReturnReadModel",
            data: { functionName: info.name },
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
