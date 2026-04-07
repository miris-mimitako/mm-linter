"use strict";

const path = require("path");

function normalizeFilename(filename) {
  return filename.split(path.sep).join("/");
}

function isTargetFile(filename, directoryNames) {
  const normalizedFilename = normalizeFilename(filename || "");
  return directoryNames.some((directoryName) => normalizedFilename.includes(`/${directoryName}/`));
}

function getDeclarationInfo(declaration) {
  if (!declaration) {
    return null;
  }

  if ((declaration.type === "FunctionDeclaration" || declaration.type === "ClassDeclaration") && declaration.id) {
    return {
      name: declaration.id.name,
      node: declaration.id,
    };
  }

  if (
    declaration.type === "VariableDeclaration" &&
    declaration.declarations.length === 1 &&
    declaration.declarations[0].id.type === "Identifier"
  ) {
    const declarator = declaration.declarations[0];
    if (
      declarator.init &&
      (declarator.init.type === "ArrowFunctionExpression" ||
        declarator.init.type === "FunctionExpression" ||
        declarator.init.type === "ClassExpression")
    ) {
      return {
        name: declarator.id.name,
        node: declarator.id,
      };
    }
  }

  return null;
}

function getJsDocComment(sourceCode, node) {
  const comments = sourceCode.getCommentsBefore(node);
  if (comments.length === 0) {
    return null;
  }

  const comment = comments[comments.length - 1];
  if (comment.type !== "Block" || !comment.value.startsWith("*")) {
    return null;
  }

  return comment;
}

function getDescriptionText(comment) {
  if (!comment) {
    return "";
  }

  return comment.value
    .split("\n")
    .map((line) => line.replace(/^\s*\* ?/, "").trim())
    .filter((line) => line.length > 0 && !line.startsWith("@"))
    .join(" ")
    .trim();
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require a minimal contract comment on exported public APIs",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          targets: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                directories: {
                  type: "array",
                  items: { type: "string" },
                },
                minDescriptionLength: {
                  type: "integer",
                  minimum: 1,
                },
              },
              required: ["directories"],
            },
          },
        },
        required: ["targets"],
      },
    ],
    messages: {
      missingCommentContract:
        "Exported API '{{name}}' must have a JSDoc contract comment.",
      shortCommentContract:
        "Exported API '{{name}}' must have a meaningful JSDoc description of at least {{minDescriptionLength}} characters.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const targets = Array.isArray(options.targets) ? options.targets : [];
    const sourceCode = context.sourceCode;

    function validate(declaration, anchorNode) {
      const info = getDeclarationInfo(declaration);
      if (!info) {
        return;
      }

      for (const target of targets) {
        if (!isTargetFile(context.filename, target.directories || [])) {
          continue;
        }

        const jsDoc = getJsDocComment(sourceCode, anchorNode || declaration);
        if (!jsDoc) {
          context.report({
            node: info.node,
            messageId: "missingCommentContract",
            data: { name: info.name },
          });
          continue;
        }

        const minDescriptionLength = Number.isInteger(target.minDescriptionLength)
          ? target.minDescriptionLength
          : 12;
        const description = getDescriptionText(jsDoc);
        if (description.length >= minDescriptionLength) {
          continue;
        }

        context.report({
          node: info.node,
          messageId: "shortCommentContract",
          data: {
            name: info.name,
            minDescriptionLength,
          },
        });
      }
    }

    return {
      ExportNamedDeclaration(node) {
        validate(node.declaration, node);
      },
      ExportDefaultDeclaration(node) {
        validate(node.declaration, node);
      },
    };
  },
};
