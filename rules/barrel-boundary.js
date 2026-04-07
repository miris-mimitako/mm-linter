"use strict";

function normalizeSource(source) {
  return source.replace(/^\.\//, "").replace(/^@\//, "");
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require imports to go through barrel boundaries",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          boundaries: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                directoryName: { type: "string" },
                maxSegments: { type: "integer", minimum: 0 },
              },
              required: ["directoryName"],
            },
          },
        },
        required: ["boundaries"],
      },
    ],
    messages: {
      internalBoundaryImport:
        "Import '{{importSource}}' crosses the '{{directoryName}}' barrel boundary. Import through the barrel instead.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const boundaries = Array.isArray(options.boundaries) ? options.boundaries : [];

    function validate(node, source) {
      if (typeof source !== "string" || source.startsWith(".")) {
        return;
      }

      const normalized = normalizeSource(source);
      const segments = normalized.split("/").filter(Boolean);

      for (const boundary of boundaries) {
        const index = segments.indexOf(boundary.directoryName);
        if (index === -1) {
          continue;
        }

        const maxSegments = Number.isInteger(boundary.maxSegments) ? boundary.maxSegments : 0;
        const nestedCount = segments.length - index - 1;
        if (nestedCount <= maxSegments) {
          continue;
        }

        context.report({
          node,
          messageId: "internalBoundaryImport",
          data: {
            directoryName: boundary.directoryName,
            importSource: source,
          },
        });
      }
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
    };
  },
};
