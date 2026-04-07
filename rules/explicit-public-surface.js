"use strict";

const path = require("path");

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Restrict exports to explicit public surface files",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          entryFiles: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    ],
    messages: {
      explicitPublicSurface:
        "Exports are only allowed from explicit public surface files: {{entryFiles}}.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const entryFiles = options.entryFiles || ["index.ts", "index.js"];
    const basename = path.basename(context.filename || "");

    function validate(node) {
      if (entryFiles.includes(basename)) {
        return;
      }

      context.report({
        node,
        messageId: "explicitPublicSurface",
        data: {
          entryFiles: entryFiles.join(", "),
        },
      });
    }

    return {
      ExportNamedDeclaration: validate,
      ExportDefaultDeclaration: validate,
      ExportAllDeclaration: validate,
    };
  },
};
