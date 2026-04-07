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

function isPublicSetter(member) {
  return (
    member.type === "MethodDefinition" &&
    member.kind === "set" &&
    member.key.type === "Identifier" &&
    member.accessibility !== "private" &&
    member.accessibility !== "protected"
  );
}

function isThisAssignment(node) {
  return (
    node.type === "AssignmentExpression" &&
    node.left.type === "MemberExpression" &&
    !node.left.computed &&
    node.left.object.type === "ThisExpression"
  );
}

function isInsideConstructor(node) {
  let current = node.parent;

  while (current) {
    if (
      current.type === "MethodDefinition" &&
      current.kind === "constructor"
    ) {
      return true;
    }

    if (
      current.type === "FunctionDeclaration" ||
      current.type === "ArrowFunctionExpression"
    ) {
      return false;
    }

    current = current.parent;
  }

  return false;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Protect value-oriented classes from uncontrolled mutation",
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          setterSuffixes: {
            type: "array",
            items: { type: "string" },
          },
          reassignSuffixes: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    ],
    messages: {
      publicSetterForbidden:
        "Class '{{className}}' must not expose public setters.",
      thisReassignmentForbidden:
        "Class '{{className}}' must not reassign '{{propertyName}}' outside its constructor.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const setterSuffixes = options.setterSuffixes || ["ValueObject"];
    const reassignSuffixes = options.reassignSuffixes || ["Entity", "ValueObject"];
    const classStack = [];

    function currentClass() {
      return classStack[classStack.length - 1] || null;
    }

    return {
      ClassDeclaration(node) {
        classStack.push(node.id ? node.id.name : null);
      },
      "ClassDeclaration:exit"() {
        classStack.pop();
      },
      MethodDefinition(node) {
        const className = currentClass();
        if (!className) {
          return;
        }

        if (!matchesAnyPattern(className, setterSuffixes.map((suffix) => `*${suffix}`))) {
          return;
        }

        if (!isPublicSetter(node)) {
          return;
        }

        context.report({
          node: node.key,
          messageId: "publicSetterForbidden",
          data: {
            className,
          },
        });
      },
      AssignmentExpression(node) {
        const className = currentClass();
        if (!className) {
          return;
        }

        if (!matchesAnyPattern(className, reassignSuffixes.map((suffix) => `*${suffix}`))) {
          return;
        }

        if (!isThisAssignment(node) || isInsideConstructor(node)) {
          return;
        }

        context.report({
          node: node.left.property,
          messageId: "thisReassignmentForbidden",
          data: {
            className,
            propertyName: node.left.property.type === "Identifier" ? node.left.property.name : "property",
          },
        });
      },
    };
  },
};
