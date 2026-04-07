"use strict";

const path = require("path");

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

function isTestFile(filename, testFilePatterns) {
  const normalizedFilename = normalizePath(filename || "");
  return testFilePatterns.some((pattern) => normalizedFilename.includes(pattern));
}

function normalizeImportSource(source) {
  return normalizePath(source || "").replace(/^@\//, "").replace(/^\.\//, "");
}

function getInternalDepth(source) {
  const normalized = normalizeImportSource(source);
  return normalized.split("/").filter(Boolean).length;
}

function includesAnySegment(source, segments) {
  const normalized = normalizeImportSource(source);
  return segments.some((segment) => normalized.includes(`/${segment}/`) || normalized.startsWith(`${segment}/`));
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Keep tests from depending on deep internal implementation details",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          testFilePatterns: {
            type: "array",
            items: { type: "string" },
          },
          maxInternalDepth: {
            type: "integer",
            minimum: 1,
          },
          denyImportSegments: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    ],
    messages: {
      testCouplingDepth:
        "Test import '{{importSource}}' is too deep. Import through a more stable public surface.",
      testCouplingSegment:
        "Test import '{{importSource}}' depends on denied internal segment '{{segment}}'.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const testFilePatterns = options.testFilePatterns || [".test.", ".spec.", "/tests/", "/__tests__/"];
    const maxInternalDepth = Number.isInteger(options.maxInternalDepth) ? options.maxInternalDepth : 3;
    const denyImportSegments = options.denyImportSegments || ["internal", "private", "impl"];

    if (!isTestFile(context.filename, testFilePatterns)) {
      return {};
    }

    function validate(node, source) {
      if (typeof source !== "string" || source.startsWith(".")) {
        return;
      }

      const depth = getInternalDepth(source);
      if (depth > maxInternalDepth) {
        context.report({
          node,
          messageId: "testCouplingDepth",
          data: { importSource: source },
        });
      }

      for (const segment of denyImportSegments) {
        if (!includesAnySegment(source, [segment])) {
          continue;
        }

        context.report({
          node,
          messageId: "testCouplingSegment",
          data: {
            importSource: source,
            segment,
          },
        });
      }
    }

    return {
      ImportDeclaration(node) {
        validate(node.source, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) {
          validate(node.source, node.source.value);
        }
      },
      ExportAllDeclaration(node) {
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
