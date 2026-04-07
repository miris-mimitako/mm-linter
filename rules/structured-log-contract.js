"use strict";

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

function getObjectKeys(node) {
  if (!node || node.type !== "ObjectExpression") {
    return [];
  }

  return node.properties
    .filter((property) => property.type === "Property" && property.key.type === "Identifier")
    .map((property) => property.key.name);
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Require structured JSON log payloads with mandatory keys",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          targets: {
            type: "array",
            items: { type: "string" },
          },
          requiredKeys: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    ],
    messages: {
      structuredLogObjectRequired:
        "Log call '{{callName}}' must receive an object literal as its first argument.",
      structuredLogMissingKey:
        "Log call '{{callName}}' must include key '{{keyName}}' in its first argument object.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const targets = options.targets || ["console.*", "logger.*", "log.*"];
    const requiredKeys = options.requiredKeys || [
      "timestamp",
      "applicationName",
      "level",
      "description",
    ];

    return {
      CallExpression(node) {
        const callName = getCalleeName(node.callee);
        if (!callName || !matchesAnyPattern(callName, targets)) {
          return;
        }

        const firstArgument = node.arguments[0];
        if (!firstArgument || firstArgument.type !== "ObjectExpression") {
          context.report({
            node: node.callee,
            messageId: "structuredLogObjectRequired",
            data: { callName },
          });
          return;
        }

        const keys = getObjectKeys(firstArgument);
        for (const requiredKey of requiredKeys) {
          if (keys.includes(requiredKey)) {
            continue;
          }

          context.report({
            node: firstArgument,
            messageId: "structuredLogMissingKey",
            data: {
              callName,
              keyName: requiredKey,
            },
          });
        }
      },
    };
  },
};
