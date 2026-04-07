"use strict";

const { getImportLayerMatch, getLayerMatchFromFilename } = require("./helpers/layer-path");

function getForbiddenLayers(options, sourceLayerName) {
  const forbidden = options.forbidden || {};
  return Array.isArray(forbidden[sourceLayerName]) ? forbidden[sourceLayerName] : [];
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow instantiating classes imported from forbidden layers",
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
      forbiddenCrossLayerInstantiation:
        "Layer '{{sourceLayerName}}' must not instantiate '{{className}}' from layer '{{targetLayerName}}'.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const sourceLayerMatch = getLayerMatchFromFilename(context.filename, options);

    if (!sourceLayerMatch) {
      return {};
    }

    const importedLayers = new Map();

    function registerImportedName(localName, importSource) {
      const targetLayerMatch = getImportLayerMatch(importSource, context.filename, options);
      if (!targetLayerMatch) {
        return;
      }

      importedLayers.set(localName, targetLayerMatch.layerName);
    }

    return {
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (!specifier.local || specifier.local.type !== "Identifier") {
            continue;
          }

          registerImportedName(specifier.local.name, node.source.value);
        }
      },
      VariableDeclarator(node) {
        if (
          node.id.type === "Identifier" &&
          node.init &&
          node.init.type === "CallExpression" &&
          node.init.callee.type === "Identifier" &&
          node.init.callee.name === "require" &&
          node.init.arguments[0] &&
          node.init.arguments[0].type === "Literal" &&
          typeof node.init.arguments[0].value === "string"
        ) {
          registerImportedName(node.id.name, node.init.arguments[0].value);
        }
      },
      NewExpression(node) {
        if (node.callee.type !== "Identifier") {
          return;
        }

        const targetLayerName = importedLayers.get(node.callee.name);
        if (!targetLayerName) {
          return;
        }

        const forbiddenLayers = getForbiddenLayers(options, sourceLayerMatch.layerName);
        if (!forbiddenLayers.includes(targetLayerName)) {
          return;
        }

        context.report({
          node: node.callee,
          messageId: "forbiddenCrossLayerInstantiation",
          data: {
            className: node.callee.name,
            sourceLayerName: sourceLayerMatch.layerName,
            targetLayerName,
          },
        });
      },
    };
  },
};
