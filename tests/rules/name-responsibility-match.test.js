"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/name-responsibility-match");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

test("name-responsibility-match rule", () => {
  const tester = new RuleTester();
  tester.run("name-responsibility-match", rule, {
    valid: [
      {
        filename: "/project/src/application/usecases/CreateUserUsecase.ts",
        code: "class CreateUserUsecase { execute() {} }",
        options: [{ targets: [{ suffix: "Usecase", allowedDirectories: ["usecases"], requiredMethods: ["execute"] }] }],
      },
    ],
    invalid: [
      {
        filename: "/project/src/domain/entities/CreateUserUsecase.ts",
        code: "class CreateUserUsecase {}",
        options: [{ targets: [{ suffix: "Usecase", allowedDirectories: ["usecases"], requiredMethods: ["execute"] }] }],
        errors: [
          { messageId: "invalidResponsibilityDirectory", data: { name: "CreateUserUsecase", directories: "usecases" } },
          { messageId: "missingResponsibilityMethod", data: { name: "CreateUserUsecase", methodName: "execute" } },
        ],
      },
    ],
  });
  assert.ok(true);
});
