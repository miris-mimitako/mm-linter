"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/query-command-separation");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

const options = {
  targets: [
    {
      directories: ["usecases"],
      queryNamePatterns: ["*Query", "get*", "find*"],
      commandNamePatterns: ["*Command", "execute*", "handle*"],
      mutationCallPatterns: ["repository.save*", "repository.update*", "repository.delete*"],
    },
  ],
};

test("query-command-separation rule", () => {
  const tester = new RuleTester();
  tester.run("query-command-separation", rule, {
    valid: [
      {
        filename: "/project/src/application/usecases/get-user.ts",
        code: "export function getUserQuery() { return repository.findById(); }",
        options: [options],
      },
      {
        filename: "/project/src/application/usecases/create-user.ts",
        code: "export function executeCreateUser() { return Result.ok(userId); }",
        options: [options],
      },
    ],
    invalid: [
      {
        filename: "/project/src/application/usecases/get-user.ts",
        code: "export function getUserQuery() { repository.saveUser(); return repository.findById(); }",
        options: [options],
        errors: [
          {
            messageId: "queryMustNotMutate",
            data: { functionName: "getUserQuery" },
          },
        ],
      },
      {
        filename: "/project/src/application/usecases/create-user.ts",
        code: "export function executeCreateUser() { return { id: 1, name: 'u' }; }",
        options: [options],
        errors: [
          {
            messageId: "commandMustNotReturnReadModel",
            data: { functionName: "executeCreateUser" },
          },
        ],
      },
    ],
  });
  assert.ok(true);
});
