"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/duplicate-role-detection");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

test("duplicate-role-detection rule", () => {
  const tester = new RuleTester();
  tester.run("duplicate-role-detection", rule, {
    valid: [
      {
        filename: "/project/src/application/usecases/create-user.ts",
        code: "export class CreateUserUsecase {}",
      },
      {
        filename: "/project/src/application/usecases/update-user.ts",
        code: "export class UpdateUserUsecase {}",
      },
    ],
    invalid: [
      {
        filename: "/project/src/application/usecases/create-user-duplicate.ts",
        code: "export class CreateUserUsecase {}",
        errors: [
          {
            messageId: "duplicateRoleDetected",
            data: {
              roleName: "CreateUserUsecase",
              originalFile: "/project/src/application/usecases/create-user.ts",
            },
          },
        ],
      },
    ],
  });
  assert.ok(true);
});
