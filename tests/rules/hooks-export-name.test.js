"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/hooks-export-name");

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
});

test("hooks-export-name rule", () => {
  const ruleTester = new RuleTester();

  ruleTester.run("hooks-export-name", rule, {
    valid: [
      {
        filename: "/project/src/hooks/use-auth.js",
        code: "export function useAuth() { return null; }",
      },
      {
        filename: "/project/src/hooks/use-session.js",
        code: "export const useSession = () => null;",
      },
      {
        filename: "/project/src/hooks/use-feature.js",
        code: "const helper = () => null; export const useFeature = helper;",
      },
      {
        filename: "/project/src/utils/hooks.ts",
        code: "export function helper() { return null; }",
      },
      {
        filename: "/project/src/hooks/use-things.js",
        code: "function helper() { return null; } export { helper };",
      },
    ],
    invalid: [
      {
        filename: "/project/src/hooks/auth.js",
        code: "export function auth() { return null; }",
        errors: [
          {
            messageId: "invalidHookExportName",
            data: { name: "auth" },
          },
        ],
      },
      {
        filename: "/project/src/hooks/session.js",
        code: "export const session = () => null;",
        errors: [
          {
            messageId: "invalidHookExportName",
            data: { name: "session" },
          },
        ],
      },
      {
        filename: "/project/src/hooks/mixed.js",
        code: "export const usegood = () => null, badHook = () => null;",
        errors: [
          {
            messageId: "invalidHookExportName",
            data: { name: "usegood" },
          },
          {
            messageId: "invalidHookExportName",
            data: { name: "badHook" },
          },
        ],
      },
    ],
  });

  assert.ok(true);
});
