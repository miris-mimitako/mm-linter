"use strict";

function getRelativeDepth(source) {
  const match = source.match(/^(\.\.\/)+/);
  if (!match) {
    return 0;
  }

  return match[0].split("../").length - 1;
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow overly deep relative imports",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          maxDepth: { type: "integer", minimum: 0 },
        },
      },
    ],
    messages: {
      forbiddenRelativeDepth:
        "Relative import depth {{depth}} exceeds the allowed maximum of {{maxDepth}}.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const maxDepth = Number.isInteger(options.maxDepth) ? options.maxDepth : 2;

    function validate(node, source) {
      if (typeof source !== "string" || !source.startsWith(".")) {
        return;
      }

      const depth = getRelativeDepth(source);
      if (depth <= maxDepth) {
        return;
      }

      context.report({
        node,
        messageId: "forbiddenRelativeDepth",
        data: { depth, maxDepth },
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
