"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/naming-consistency-between-file-and-symbol");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

test("naming-consistency-between-file-and-symbol rule", () => {
  const tester = new RuleTester();
  tester.run("naming-consistency-between-file-and-symbol", rule, {
    valid: [
      {
        filename: "/project/src/application/usecases/create-user.usecase.ts",
        code: "export class CreateUser {}",
      },
      {
        filename: "/project/src/presentation/user.presenter.ts",
        code: "export const user = () => null;",
        options: [{ ignoreFileSuffixes: [".presenter"] }],
      },
    ],
    invalid: [
      {
        filename: "/project/src/application/usecases/create-user.usecase.ts",
        code: "export class UpdateUser {}",
        errors: [
          {
            messageId: "fileSymbolNameMismatch",
            data: { actualName: "UpdateUser", expectedNames: "CreateUser, createUser" },
          },
        ],
      },
      {
        filename: "/project/src/presentation/user.presenter.ts",
        code: "export default class {}",
        options: [{ ignoreFileSuffixes: [".presenter"] }],
        errors: [{ messageId: "anonymousDefaultExport" }],
      },
    ],
  });
  assert.ok(true);
});
