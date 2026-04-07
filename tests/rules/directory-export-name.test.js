"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/directory-export-name");

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
});

test("directory-export-name rule", () => {
  const ruleTester = new RuleTester();

  ruleTester.run("directory-export-name", rule, {
    valid: [
      {
        filename: "/project/src/presenter/user.js",
        code: "export function UserPresenter() { return null; }",
        options: [
          {
            targets: [
              {
                directoryName: "presenter",
                pattern: "Presenter$",
                format: "XxxPresenter",
                subject: "presenters",
              },
            ],
          },
        ],
      },
      {
        filename: "/project/src/factory/user.js",
        code: "export const UserFactory = () => null;",
        options: [
          {
            targets: [
              {
                directoryName: "factory",
                pattern: "Factory$",
                format: "XxxFactory",
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      {
        filename: "/project/src/presenter/user.js",
        code: "export function user() { return null; }",
        options: [
          {
            targets: [
              {
                directoryName: "presenter",
                pattern: "Presenter$",
                format: "XxxPresenter",
                subject: "presenters",
              },
            ],
          },
        ],
        errors: [
          {
            messageId: "invalidDirectoryExportName",
            data: {
              directoryName: "presenter",
              format: "XxxPresenter",
              name: "user",
              subject: "presenters",
            },
          },
        ],
      },
    ],
  });

  assert.ok(true);
});
