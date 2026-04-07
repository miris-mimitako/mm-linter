"use strict";

function isConsoleCall(statement) {
  return (
    statement.type === "ExpressionStatement" &&
    statement.expression.type === "CallExpression" &&
    statement.expression.callee.type === "MemberExpression" &&
    !statement.expression.callee.computed &&
    statement.expression.callee.object.type === "Identifier" &&
    statement.expression.callee.object.name === "console"
  );
}

function isBareReturn(statement) {
  return (
    statement.type === "ReturnStatement" &&
    (!statement.argument ||
      (statement.argument.type === "Literal" &&
        (statement.argument.value === null || statement.argument.value === false)))
  );
}

function isSwallowingCatch(bodyStatements) {
  if (bodyStatements.length === 0) {
    return true;
  }

  if (bodyStatements.some((statement) => statement.type === "ThrowStatement")) {
    return false;
  }

  return bodyStatements.every((statement) => isConsoleCall(statement) || isBareReturn(statement));
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow empty catch blocks and swallowed errors",
    },
    schema: [],
    messages: {
      emptyCatchOrSwallow:
        "Catch block swallows the error. Re-throw or handle it explicitly.",
    },
  },
  create(context) {
    return {
      CatchClause(node) {
        if (!isSwallowingCatch(node.body.body)) {
          return;
        }

        context.report({
          node,
          messageId: "emptyCatchOrSwallow",
        });
      },
    };
  },
};
