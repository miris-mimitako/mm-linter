"use strict";

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow TODO-like comments in shippable code",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          patterns: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    ],
    messages: {
      noTodoShipping:
        "Comment contains shipping-forbidden marker '{{pattern}}'.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const patterns = options.patterns || ["TODO", "FIXME", "temporary", "dummy", "mock", "for now"];
    const sourceCode = context.sourceCode;

    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          for (const pattern of patterns) {
            if (!comment.value.toLowerCase().includes(pattern.toLowerCase())) {
              continue;
            }

            context.report({
              loc: comment.loc,
              messageId: "noTodoShipping",
              data: { pattern },
            });
          }
        }
      },
    };
  },
};
