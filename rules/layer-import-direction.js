"use strict";

const { getImportLayerMatch, getLayerMatchFromFilename } = require("./helpers/layer-path");

function getForbiddenLayers(options, sourceLayerName) {
  const forbidden = options.forbidden || {};
  return Array.isArray(forbidden[sourceLayerName]) ? forbidden[sourceLayerName] : [];
}

function reportForbiddenImport(context, node, sourceLayerName, targetLayerName, importSource) {
  context.report({
    node,
    messageId: "forbiddenLayerImport",
    data: {
      importSource,
      sourceLayerName,
      targetLayerName,
    },
  });
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce allowed import directions between architecture layers",
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
          aliases: {
            type: "array",
            items: { type: "string" },
          },
          layers: {
            type: "object",
            additionalProperties: {
              type: "object",
            },
          },
          forbidden: {
            type: "object",
            additionalProperties: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
        required: ["layers", "forbidden"],
      },
    ],
    messages: {
      forbiddenLayerImport:
        "Layer '{{sourceLayerName}}' must not import '{{targetLayerName}}' via '{{importSource}}'.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const sourceLayerMatch = getLayerMatchFromFilename(context.filename, options);

    if (!sourceLayerMatch) {
      return {};
    }

    function validateImport(node, importSource) {
      const targetLayerMatch = getImportLayerMatch(importSource, context.filename, options);
      if (!targetLayerMatch) {
        return;
      }

      const forbiddenLayers = getForbiddenLayers(options, sourceLayerMatch.layerName);
      if (!forbiddenLayers.includes(targetLayerMatch.layerName)) {
        return;
      }

      reportForbiddenImport(
        context,
        node,
        sourceLayerMatch.layerName,
        targetLayerMatch.layerName,
        importSource
      );
    }

    return {
      ImportDeclaration(node) {
        validateImport(node.source, node.source.value);
      },
      ExportAllDeclaration(node) {
        if (node.source) {
          validateImport(node.source, node.source.value);
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          validateImport(node.source, node.source.value);
        }
      },
      CallExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "require" &&
          node.arguments.length > 0 &&
          node.arguments[0].type === "Literal" &&
          typeof node.arguments[0].value === "string"
        ) {
          validateImport(node.arguments[0], node.arguments[0].value);
        }
      },
    };
  },
};
