"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/result-error-handling");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

const options = {
  targets: [
    {
      directories: ["usecases"],
      functionNamePatterns: ["execute*", "handle*"],
      resultCallPatterns: ["Result.*", "ok", "err"],
    },
  ],
};

test("result-error-handling rule", () => {
  const tester = new RuleTester();
  tester.run("result-error-handling", rule, {
    valid: [
      {
        filename: "/project/src/application/usecases/create-user.ts",
        code: "export function executeCreateUser() { return Result.ok({}); }",
        options: [options],
      },
      {
        filename: "/project/src/application/usecases/create-user.ts",
        code: "export const handleCreateUser = () => ok({});",
        options: [options],
      },
    ],
    invalid: [
      {
        filename: "/project/src/application/usecases/create-user.ts",
        code: "export function executeCreateUser() { throw new Error('x'); }",
        options: [options],
        errors: [
          {
            messageId: "resultHandlingThrow",
            data: { functionName: "executeCreateUser" },
          },
          {
            messageId: "missingResultReturn",
            data: { functionName: "executeCreateUser", resultPatterns: "Result.*, ok, err" },
          },
        ],
      },
      {
        filename: "/project/src/application/usecases/create-user.ts",
        code: "export const handleCreateUser = () => user;",
        options: [options],
        errors: [
          {
            messageId: "missingResultReturn",
            data: { functionName: "handleCreateUser", resultPatterns: "Result.*, ok, err" },
          },
        ],
      },
    ],
  });
  assert.ok(true);
});
