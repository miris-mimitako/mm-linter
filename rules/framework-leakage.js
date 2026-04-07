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

function getBasePackageName(source) {
  if (typeof source !== "string" || source.startsWith(".") || source.startsWith("/")) {
    return null;
  }

  const segments = source.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  if (segments[0].startsWith("@") && segments.length > 1) {
    return `${segments[0]}/${segments[1]}`;
  }

  return segments[0];
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prevent framework and library leakage into restricted layers",
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
                denyImports: {
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
      frameworkLeakage:
        "Layer '{{layerName}}' must not import '{{packageName}}'.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const layerMatch = getLayerMatchFromFilename(context.filename, options);

    if (!layerMatch) {
      return {};
    }

    const layerRule = options.layers[layerMatch.layerName] || {};
    const denyImports = layerRule.denyImports || [];

    function validate(node, sourceValue) {
      const packageName = getBasePackageName(sourceValue);
      if (!packageName) {
        return;
      }

      if (!matchesAnyPattern(packageName, denyImports)) {
        return;
      }

      context.report({
        node,
        messageId: "frameworkLeakage",
        data: {
          layerName: layerMatch.layerName,
          packageName,
        },
      });
    }

    return {
      ImportDeclaration(node) {
        validate(node.source, node.source.value);
      },
      ExportAllDeclaration(node) {
        if (node.source) {
          validate(node.source, node.source.value);
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          validate(node.source, node.source.value);
        }
      },
      CallExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "require" &&
          node.arguments[0] &&
          node.arguments[0].type === "Literal" &&
          typeof node.arguments[0].value === "string"
        ) {
          validate(node.arguments[0], node.arguments[0].value);
        }
      },
    };
  },
};
