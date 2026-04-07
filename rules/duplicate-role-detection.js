"use strict";

const seenRoles = new Map();

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegExp(pattern) {
  return new RegExp(`^${escapeRegExp(pattern).replace(/\*/g, ".*")}$`);
}

function matchesAnyPattern(value, patterns) {
  return Array.isArray(patterns) && patterns.some((pattern) => globToRegExp(pattern).test(value));
}

function getDeclaredName(declaration) {
  if (!declaration) {
    return null;
  }

  if ((declaration.type === "ClassDeclaration" || declaration.type === "FunctionDeclaration") && declaration.id) {
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
    type: "problem",
    docs: {
      description: "Detect duplicate exported role names across files in the same lint run",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          roleNamePatterns: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    ],
    messages: {
      duplicateRoleDetected:
        "Role '{{roleName}}' is already defined in '{{originalFile}}'. Avoid duplicate role implementations.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const roleNamePatterns = options.roleNamePatterns || ["*Usecase", "*Repository", "*Query", "*Command"];

    return {
      Program() {
        if (context.filename === "<input>") {
          seenRoles.clear();
        }
      },
      ExportNamedDeclaration(node) {
        const roleName = getDeclaredName(node.declaration);
        if (!roleName || !matchesAnyPattern(roleName, roleNamePatterns)) {
          return;
        }

        const originalFile = seenRoles.get(roleName);
        if (originalFile && originalFile !== context.filename) {
          context.report({
            node: node.declaration,
            messageId: "duplicateRoleDetected",
            data: {
              roleName,
              originalFile,
            },
          });
          return;
        }

        seenRoles.set(roleName, context.filename);
      },
    };
  },
};
