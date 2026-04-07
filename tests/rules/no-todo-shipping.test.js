"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/no-todo-shipping");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

test("no-todo-shipping rule", () => {
  const tester = new RuleTester();
  tester.run("no-todo-shipping", rule, {
    valid: [{ code: "// done\nconst a = 1;" }],
    invalid: [
      {
        code: "// TODO remove this\nconst a = 1;",
        errors: [{ messageId: "noTodoShipping", data: { pattern: "TODO" } }],
      },
    ],
  });
  assert.ok(true);
});
