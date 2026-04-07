"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/usecase-export-name");

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
});

test("usecase-export-name rule", () => {
  const ruleTester = new RuleTester();

  ruleTester.run("usecase-export-name", rule, {
    valid: [
      {
        filename: "/project/src/usecase/create-user-usecase.js",
        code: "export function CreateUserUsecase() { return null; }",
      },
      {
        filename: "/project/src/usecase/update-user-usecase.js",
        code: "export const UpdateUserUsecase = () => null;",
      },
      {
        filename: "/project/src/usecase/remove-user-usecase.js",
        code: "const helper = () => null; export const RemoveUserUsecase = helper;",
      },
      {
        filename: "/project/src/utils/usecase.ts",
        code: "export function helper() { return null; }",
      },
      {
        filename: "/project/src/usecase/things.js",
        code: "function helper() { return null; } export { helper };",
      },
    ],
    invalid: [
      {
        filename: "/project/src/usecase/create-user.js",
        code: "export function createUser() { return null; }",
        errors: [
          {
            messageId: "invalidUsecaseExportName",
            data: { name: "createUser" },
          },
        ],
      },
      {
        filename: "/project/src/usecase/update-user.js",
        code: "export const updateUser = () => null;",
        errors: [
          {
            messageId: "invalidUsecaseExportName",
            data: { name: "updateUser" },
          },
        ],
      },
      {
        filename: "/project/src/usecase/mixed.js",
        code: "export const CreateUserUsecase = () => null, badFactory = () => null;",
        errors: [
          {
            messageId: "invalidUsecaseExportName",
            data: { name: "badFactory" },
          },
        ],
      },
    ],
  });

  assert.ok(true);
});
