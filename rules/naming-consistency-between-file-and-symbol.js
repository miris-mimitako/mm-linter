"use strict";

const path = require("path");

function stripExtension(filename) {
  return filename.replace(/\.[^.]+$/, "");
}

function normalizeBaseName(baseName, ignoreSuffixes) {
  let name = baseName;

  for (const suffix of ignoreSuffixes) {
    if (name.endsWith(suffix)) {
      name = name.slice(0, -suffix.length);
      break;
    }
  }

  return name;
}

function toPascalCase(value) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function getExpectedNames(filename, ignoreSuffixes) {
  const baseName = stripExtension(path.basename(filename || ""));
  const normalizedBaseName = normalizeBaseName(baseName, ignoreSuffixes);
  const pascalName = toPascalCase(normalizedBaseName);

  return [pascalName, pascalName.charAt(0).toLowerCase() + pascalName.slice(1)].filter(Boolean);
}

function getDeclaredName(declaration) {
  if (!declaration) {
    return null;
  }

  if ((declaration.type === "FunctionDeclaration" || declaration.type === "ClassDeclaration") && declaration.id) {
    return declaration.id.name;
  }

  if (
    declaration.type === "VariableDeclaration" &&
    declaration.declarations.length === 1 &&
    declaration.declarations[0].id.type === "Identifier"
  ) {
    return declaration.declarations[0].id.name;
  }

  return null;
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Ensure exported symbol names are consistent with file names",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          ignoreFileSuffixes: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    ],
    messages: {
      fileSymbolNameMismatch:
        "Exported symbol '{{actualName}}' does not match file name. Expected one of: {{expectedNames}}.",
      anonymousDefaultExport:
        "Default export must be named so it can be matched against the file name.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const ignoreFileSuffixes = options.ignoreFileSuffixes || [
      ".test",
      ".spec",
      ".entity",
      ".service",
      ".usecase",
      ".dto",
      ".presentation",
    ];
    const expectedNames = getExpectedNames(context.filename, ignoreFileSuffixes);

    function validateName(node, actualName) {
      if (!actualName || expectedNames.includes(actualName)) {
        return;
      }

      context.report({
        node,
        messageId: "fileSymbolNameMismatch",
        data: {
          actualName,
          expectedNames: expectedNames.join(", "),
        },
      });
    }

    return {
      ExportNamedDeclaration(node) {
        const declaredName = getDeclaredName(node.declaration);
        if (declaredName) {
          validateName(node.declaration, declaredName);
        }
      },
      ExportDefaultDeclaration(node) {
        const declaredName = getDeclaredName(node.declaration);
        if (!declaredName) {
          context.report({
            node,
            messageId: "anonymousDefaultExport",
          });
          return;
        }

        validateName(node.declaration, declaredName);
      },
    };
  },
};
