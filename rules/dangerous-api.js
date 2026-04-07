"use strict";

const { getLayerMatchFromFilename } = require("./helpers/layer-path");

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegExp(pattern) {
  return new RegExp(`^${escapeRegExp(pattern).replace(/\*/g, ".*")}$`);
}

function matchesAnyPattern(value, patterns) {
  if (!Array.isArray(patterns) || patterns.length === 0) {
    return false;
  }

  return patterns.some((pattern) => globToRegExp(pattern).test(value));
}

function getMemberName(node) {
  if (!node) {
    return null;
  }

  if (node.type === "Identifier") {
    return node.name;
  }

  if (node.type !== "MemberExpression" || node.computed) {
    return null;
  }

  const objectName = getMemberName(node.object);
  const propertyName = getMemberName(node.property);

  if (!objectName || !propertyName) {
    return null;
  }

  return `${objectName}.${propertyName}`;
}

function getExpressionName(node) {
  if (!node) {
    return null;
  }

  if (node.type === "Identifier") {
    return node.name;
  }

  if (node.type === "ThisExpression") {
    return "this";
  }

  if (node.type === "MemberExpression") {
    return getMemberName(node);
  }

  return null;
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
      description: "Disallow dangerous APIs in specific architecture layers",
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
      dangerousApiUse:
        "API '{{apiName}}' is denied in layer '{{layerName}}'.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const layerMatch = getLayerMatchFromFilename(context.filename, options);

    if (!layerMatch) {
      return {};
    }

    const layerRule = options.layers[layerMatch.layerName] || {};
    const denyPatterns = layerRule.deny || [];

    function validate(node, expressionName) {
      if (!expressionName || !matchesAnyPattern(expressionName, denyPatterns)) {
        return;
      }

      context.report({
        node,
        messageId: "dangerousApiUse",
        data: {
          apiName: expressionName,
          layerName: layerMatch.layerName,
        },
      });
    }

    return {
      CallExpression(node) {
        validate(node.callee, getExpressionName(node.callee));
      },
      NewExpression(node) {
        validate(node.callee, getExpressionName(node.callee));
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
