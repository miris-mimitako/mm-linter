"use strict";

const { getLayerMatchFromFilename } = require("./helpers/layer-path");

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegExp(pattern) {
  return new RegExp(`^${escapeRegExp(pattern).replace(/\*/g, ".*")}$`);
}

function matchesAnyPattern(value, patterns) {
  return Array.isArray(patterns) && patterns.some((pattern) => globToRegExp(pattern).test(value));
}

function getExpressionName(node) {
  if (!node) {
    return null;
  }

  if (node.type === "Identifier") {
    return node.name;
  }

  if (node.type === "MemberExpression" && !node.computed) {
    const objectName = getExpressionName(node.object);
    const propertyName = getExpressionName(node.property);
    if (objectName && propertyName) {
      return `${objectName}.${propertyName}`;
    }
  }

  return null;
}

function isTopLevel(node) {
  let current = node;

  while (current.parent) {
    if (
      current.parent.type === "FunctionDeclaration" ||
      current.parent.type === "FunctionExpression" ||
      current.parent.type === "ArrowFunctionExpression" ||
      current.parent.type === "ClassBody"
    ) {
      return false;
    }

    current = current.parent;
  }

  return true;
}

function shouldSkipMemberExpression(node) {
  return (
    (node.parent.type === "CallExpression" || node.parent.type === "NewExpression") &&
    node.parent.callee === node
  );
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow side effects at module top level in selected layers",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          rootDirs: {
            type: "array",
            items: { type: "string" },
          },
          layers: {
            type: "object",
            additionalProperties: {
              type: "object",
              additionalProperties: false,
              properties: {
                deny: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
          },
        },
        required: ["layers"],
      },
    ],
    messages: {
      topLevelSideEffect:
        "Top-level side effect '{{apiName}}' is denied in layer '{{layerName}}'.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const layerMatch = getLayerMatchFromFilename(context.filename, options);

    if (!layerMatch) {
      return {};
    }

    const layerRule = options.layers[layerMatch.layerName] || {};
    const deny = layerRule.deny || [];

    function validate(node, name) {
      if (!isTopLevel(node)) {
        return;
      }

      if (!name || !matchesAnyPattern(name, deny)) {
        return;
      }

      context.report({
        node,
        messageId: "topLevelSideEffect",
        data: {
          apiName: name,
          layerName: layerMatch.layerName,
        },
      });
    }

    return {
      CallExpression(node) {
        validate(node, getExpressionName(node.callee));
      },
      NewExpression(node) {
        validate(node, getExpressionName(node.callee));
      },
      MemberExpression(node) {
        if (shouldSkipMemberExpression(node)) {
          return;
        }

        validate(node, getExpressionName(node));
      },
    };
  },
};
