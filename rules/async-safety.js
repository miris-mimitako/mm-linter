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

function isHandled(node) {
  const parent = node.parent;
  if (!parent) {
    return false;
  }

  if (parent.type === "AwaitExpression") {
    return true;
  }

  if (parent.type === "ReturnStatement") {
    return true;
  }

  if (parent.type === "VariableDeclarator") {
    return true;
  }

  if (parent.type === "ArrowFunctionExpression") {
    return true;
  }

  if (parent.type === "UnaryExpression" && parent.operator === "void") {
    return true;
  }

  return false;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow floating async or promise-returning calls",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          promiseCallPatterns: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    ],
    messages: {
      floatingAsyncCall:
        "Promise-returning call '{{callName}}' must be awaited, returned, assigned, or explicitly ignored with void.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const promiseCallPatterns = options.promiseCallPatterns || [
      "fetch",
      "*.then",
      "*.catch",
      "*.finally",
      "client.*",
      "repository.*",
      "service.*",
      "usecase.*",
      "execute*",
      "handle*",
      "load*",
      "save*",
      "create*Async",
      "*Async",
    ];

    return {
      CallExpression(node) {
        if (isHandled(node)) {
          return;
        }

        if (node.parent.type !== "ExpressionStatement") {
          return;
        }

        const callName = getCalleeName(node.callee);
        if (!callName || !matchesAnyPattern(callName, promiseCallPatterns)) {
          return;
        }

        context.report({
          node: node.callee,
          messageId: "floatingAsyncCall",
          data: { callName },
        });
      },
    };
  },
};
