"use strict";

const { getLayerMatchFromFilename } = require("./helpers/layer-path");

function countStatements(node) {
  if (!node.body || node.body.type !== "BlockStatement") {
    return 1;
  }

  return node.body.body.length;
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow large inline implementations in interface layers",
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
                maxStatements: { type: "integer", minimum: 0 },
              },
            },
          },
        },
        required: ["layers"],
      },
    ],
    messages: {
      tooManyInlineStatements:
        "Inline implementation in layer '{{layerName}}' has {{statementCount}} statements, exceeding the limit of {{maxStatements}}.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const layerMatch = getLayerMatchFromFilename(context.filename, options);

    if (!layerMatch) {
      return {};
    }

    const layerRule = options.layers[layerMatch.layerName] || {};
    if (!Number.isInteger(layerRule.maxStatements)) {
      return {};
    }

    function validate(node) {
      const statementCount = countStatements(node.value || node);
      if (statementCount <= layerRule.maxStatements) {
        return;
      }

      context.report({
        node,
        messageId: "tooManyInlineStatements",
        data: {
          layerName: layerMatch.layerName,
          statementCount,
          maxStatements: layerRule.maxStatements,
        },
      });
    }

    return {
      FunctionDeclaration: validate,
      FunctionExpression: validate,
      ArrowFunctionExpression: validate,
      MethodDefinition: validate,
    };
  },
};
