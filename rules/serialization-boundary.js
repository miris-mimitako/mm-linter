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

function getName(node) {
  if (!node) {
    return null;
  }

  if (node.type === "Identifier") {
    return node.name;
  }

  if (node.type === "MemberExpression" && !node.computed) {
    const objectName = getName(node.object);
    const propertyName = getName(node.property);
    if (objectName && propertyName) {
      return `${objectName}.${propertyName}`;
    }
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
      description: "Keep serialization APIs at explicit boundaries",
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
      serializationBoundaryViolation:
        "Serialization API '{{apiName}}' is not allowed in layer '{{layerName}}'. Move it to an explicit boundary.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const layerMatch = getLayerMatchFromFilename(context.filename, options);

    if (!layerMatch) {
      return {};
    }

    const layerRule = options.layers[layerMatch.layerName] || {};
    const deny = layerRule.deny || ["JSON.stringify", "JSON.parse", "structuredClone"];

    function validate(node, name) {
      if (!name || !matchesAnyPattern(name, deny)) {
        return;
      }

      context.report({
        node,
        messageId: "serializationBoundaryViolation",
        data: {
          apiName: name,
          layerName: layerMatch.layerName,
        },
      });
    }

    return {
      CallExpression(node) {
        validate(node.callee, getName(node.callee));
      },
      MemberExpression(node) {
        if (shouldSkipMemberExpression(node)) {
          return;
        }

        validate(node, getName(node));
      },
    };
  },
};
