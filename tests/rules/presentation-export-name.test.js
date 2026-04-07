"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/presentation-export-name");

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
});

test("presentation-export-name rule", () => {
  const ruleTester = new RuleTester();

  ruleTester.run("presentation-export-name", rule, {
    valid: [
      {
        filename: "/project/src/presentation/user-presentation.js",
        code: "export function UserPresentation() { return null; }",
      },
      {
        filename: "/project/src/presentation/session-presentation.js",
        code: "export const SessionPresentation = () => null;",
      },
      {
        filename: "/project/src/presentation/feature-presentation.js",
        code: "const helper = () => null; export const FeaturePresentation = helper;",
      },
      {
        filename: "/project/src/utils/presentation.ts",
        code: "export function helper() { return null; }",
      },
      {
        filename: "/project/src/presentation/things.js",
        code: "function helper() { return null; } export { helper };",
      },
    ],
    invalid: [
      {
        filename: "/project/src/presentation/user.js",
        code: "export function user() { return null; }",
        errors: [
          {
            messageId: "invalidPresentationExportName",
            data: { name: "user" },
          },
        ],
      },
      {
        filename: "/project/src/presentation/session.js",
        code: "export const session = () => null;",
        errors: [
          {
            messageId: "invalidPresentationExportName",
            data: { name: "session" },
          },
        ],
      },
      {
        filename: "/project/src/presentation/mixed.js",
        code: "export const UserPresentation = () => null, badFactory = () => null;",
        errors: [
          {
            messageId: "invalidPresentationExportName",
            data: { name: "badFactory" },
          },
        ],
      },
    ],
  });

  assert.ok(true);
});
