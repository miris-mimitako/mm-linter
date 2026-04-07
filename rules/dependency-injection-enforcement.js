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

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require dependency injection or factory/provider usage instead of direct instantiation",
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
                denyNew: {
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
      directInstantiationDenied:
        "Layer '{{layerName}}' must not directly instantiate '{{className}}'. Use dependency injection or a factory/provider.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const layerMatch = getLayerMatchFromFilename(context.filename, options);

    if (!layerMatch) {
      return {};
    }

    const layerRule = options.layers[layerMatch.layerName] || {};
    const denyNew = layerRule.denyNew || [];

    return {
      NewExpression(node) {
        const className = getCalleeName(node.callee);
        if (!className || !matchesAnyPattern(className, denyNew)) {
          return;
        }

        context.report({
          node: node.callee,
          messageId: "directInstantiationDenied",
          data: {
            className,
            layerName: layerMatch.layerName,
          },
        });
      },
    };
  },
};
