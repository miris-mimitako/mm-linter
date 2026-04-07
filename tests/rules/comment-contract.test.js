"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/comment-contract");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

const options = {
  targets: [
    {
      directories: ["usecases", "repositories"],
      minDescriptionLength: 12,
    },
  ],
};

test("comment-contract rule", () => {
  const tester = new RuleTester();
  tester.run("comment-contract", rule, {
    valid: [
      {
        filename: "/project/src/application/usecases/create-user.ts",
        code: "/** Creates a user and returns a result. */\nexport function executeCreateUser() { return Result.ok({}); }",
        options: [options],
      },
    ],
    invalid: [
      {
        filename: "/project/src/application/usecases/create-user.ts",
        code: "export function executeCreateUser() { return Result.ok({}); }",
        options: [options],
        errors: [
          {
            messageId: "missingCommentContract",
            data: { name: "executeCreateUser" },
          },
        ],
      },
      {
        filename: "/project/src/application/usecases/create-user.ts",
        code: "/** short */\nexport function executeCreateUser() { return Result.ok({}); }",
        options: [options],
        errors: [
          {
            messageId: "shortCommentContract",
            data: { name: "executeCreateUser", minDescriptionLength: 12 },
          },
        ],
      },
    ],
  });
  assert.ok(true);
});
