"use strict";

const path = require("path");

const DEFAULT_ROOT_DIRS = ["src"];

function normalizeFilename(filename) {
  return filename.split(path.sep).join("/");
}

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegExp(pattern) {
  const expression = escapeRegExp(pattern)
    .replace(/\*/g, ".*")
    .replace(/!/g, "!");

  return new RegExp(`^${expression}$`);
}

function matchesAnyPattern(value, patterns) {
  if (!Array.isArray(patterns) || patterns.length === 0) {
    return false;
  }

  return patterns.some((pattern) => globToRegExp(pattern).test(value));
}

function extractFunctionName(node) {
  if (node.type === "FunctionDeclaration" && node.id) {
    return node.id.name;
  }

  if (
    node.type === "VariableDeclarator" &&
    node.id.type === "Identifier" &&
    node.init &&
    (node.init.type === "ArrowFunctionExpression" || node.init.type === "FunctionExpression")
  ) {
    return node.id.name;
  }

  return null;
}

function getLayerMatch(filename, options) {
  if (!filename || filename === "<input>") {
    return null;
  }

  const normalizedFilename = normalizeFilename(filename);
  const segments = normalizedFilename.split("/").filter(Boolean);
  const rootDirs = options.rootDirs && options.rootDirs.length > 0 ? options.rootDirs : DEFAULT_ROOT_DIRS;
  const layerNames = Object.keys(options.layers || {});

  for (let index = 0; index < segments.length; index += 1) {
    if (!rootDirs.includes(segments[index])) {
      continue;
    }

    const layerName = segments[index + 1];
    if (!layerNames.includes(layerName)) {
      continue;
    }

    return {
      filename: normalizedFilename,
      layerName,
      directories: segments.slice(index + 2, -1),
      fileName: segments[segments.length - 1],
    };
  }

  return null;
}

function report(context, node, messageId, data) {
  context.report({
    node,
    messageId,
    data,
  });
}

function validatePolicyValue(context, node, value, policy, reportData) {
  if (!policy) {
    return;
  }

  if (matchesAnyPattern(value, policy.deny)) {
    report(context, node, reportData.denyMessageId, reportData);
    return;
  }

  if (Array.isArray(policy.allow) && policy.allow.length > 0 && !matchesAnyPattern(value, policy.allow)) {
    report(context, node, reportData.allowMessageId, reportData);
  }
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce directory, file, and function naming rules for architecture layers",
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
          denyLayers: {
            type: "array",
            items: { type: "string" },
          },
          locked: { type: "boolean" },
          customization: {
            type: "object",
            additionalProperties: false,
            properties: {
              allowNewLayers: { type: "boolean" },
              allowAllowRules: { type: "boolean" },
              allowDenyRules: { type: "boolean" },
            },
          },
          layers: {
            type: "object",
            additionalProperties: {
              type: "object",
              additionalProperties: false,
              properties: {
                enabled: { type: "boolean" },
                directories: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    allow: {
                      type: "array",
                      items: { type: "string" },
                    },
                    deny: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
                files: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    allow: {
                      type: "array",
                      items: { type: "string" },
                    },
                    deny: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
                functions: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    allow: {
                      type: "array",
                      items: { type: "string" },
                    },
                    deny: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        required: ["layers"],
      },
    ],
    messages: {
      deniedLayer: "The '{{layerName}}' layer is denied by the layer-structure configuration.",
      disabledLayer: "The '{{layerName}}' layer is disabled by the layer-structure configuration.",
      deniedDirectoryName:
        "Directory '{{value}}' is denied in layer '{{layerName}}'.",
      invalidDirectoryName:
        "Directory '{{value}}' is not allowed in layer '{{layerName}}'.",
      deniedFileName: "File '{{value}}' is denied in layer '{{layerName}}'.",
      invalidFileName: "File '{{value}}' is not allowed in layer '{{layerName}}'.",
      deniedFunctionName:
        "Function '{{value}}' is denied in layer '{{layerName}}'.",
      invalidFunctionName:
        "Function '{{value}}' is not allowed in layer '{{layerName}}'.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const layerMatch = getLayerMatch(context.filename, options);

    if (!layerMatch) {
      return {};
    }

    const layerRule = options.layers[layerMatch.layerName] || {};
    const deniedLayers = options.denyLayers || [];
    let hasReportedLayerError = false;

    function reportLayerError(node, messageId) {
      if (hasReportedLayerError) {
        return;
      }

      hasReportedLayerError = true;
      report(context, node, messageId, { layerName: layerMatch.layerName });
    }

    function ensureLayerAllowed(node) {
      if (deniedLayers.includes(layerMatch.layerName)) {
        reportLayerError(node, "deniedLayer");
        return false;
      }

      if (layerRule.enabled === false) {
        reportLayerError(node, "disabledLayer");
        return false;
      }

      return true;
    }

    return {
      Program(node) {
        if (!ensureLayerAllowed(node)) {
          return;
        }

        for (const directoryName of layerMatch.directories) {
          validatePolicyValue(context, node, directoryName, layerRule.directories, {
            layerName: layerMatch.layerName,
            value: directoryName,
            denyMessageId: "deniedDirectoryName",
            allowMessageId: "invalidDirectoryName",
          });
        }

        validatePolicyValue(context, node, layerMatch.fileName, layerRule.files, {
          layerName: layerMatch.layerName,
          value: layerMatch.fileName,
          denyMessageId: "deniedFileName",
          allowMessageId: "invalidFileName",
        });
      },
      FunctionDeclaration(node) {
        if (!ensureLayerAllowed(node)) {
          return;
        }

        const functionName = extractFunctionName(node);
        if (!functionName) {
          return;
        }

        validatePolicyValue(context, node.id, functionName, layerRule.functions, {
          layerName: layerMatch.layerName,
          value: functionName,
          denyMessageId: "deniedFunctionName",
          allowMessageId: "invalidFunctionName",
        });
      },
      VariableDeclarator(node) {
        if (!ensureLayerAllowed(node)) {
          return;
        }

        const functionName = extractFunctionName(node);
        if (!functionName) {
          return;
        }

        validatePolicyValue(context, node.id, functionName, layerRule.functions, {
          layerName: layerMatch.layerName,
          value: functionName,
          denyMessageId: "deniedFunctionName",
          allowMessageId: "invalidFunctionName",
        });
      },
    };
  },
};
