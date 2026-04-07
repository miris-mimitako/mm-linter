"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/side-effect-boundary");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

const options = {
  rootDirs: ["src"],
  layers: {
    domain: {
      deny: ["fetch", "console.log", "process.env", "Date.now"],
    },
    application: {
      deny: ["console.log"],
    },
  },
};

test("side-effect-boundary rule", () => {
  const tester = new RuleTester();
  tester.run("side-effect-boundary", rule, {
    valid: [
      {
        filename: "/project/src/domain/entity.ts",
        code: "function load() { return fetch('/users'); }",
        options: [options],
      },
      {
        filename: "/project/src/domain/entity.ts",
        code: "const now = () => Date.now();",
        options: [options],
      },
      {
        filename: "/project/src/application/usecase.ts",
        code: "function debug() { console.log('x'); }",
        options: [options],
      },
    ],
    invalid: [
      {
        filename: "/project/src/domain/entity.ts",
        code: "fetch('/users');",
        options: [options],
        errors: [{ messageId: "topLevelSideEffect", data: { apiName: "fetch", layerName: "domain" } }],
      },
      {
        filename: "/project/src/domain/entity.ts",
        code: "const env = process.env.NODE_ENV;",
        options: [options],
        errors: [{ messageId: "topLevelSideEffect", data: { apiName: "process.env", layerName: "domain" } }],
      },
      {
        filename: "/project/src/application/usecase.ts",
        code: "console.log('debug');",
        options: [options],
        errors: [{ messageId: "topLevelSideEffect", data: { apiName: "console.log", layerName: "application" } }],
      },
    ],
  });
  assert.ok(true);
});
