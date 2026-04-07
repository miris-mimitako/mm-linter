"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/testability-guard");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

test("testability-guard rule", () => {
  const tester = new RuleTester();
  tester.run("testability-guard", rule, {
    valid: [
      {
        filename: "/project/src/domain/entity.ts",
        code: "clock.now();",
        options: [{ layers: { domain: {} } }],
      },
    ],
    invalid: [
      {
        filename: "/project/src/domain/entity.ts",
        code: "Date.now();",
        options: [{ layers: { domain: {} } }],
        errors: [{ messageId: "testabilityGuardViolation", data: { apiName: "Date.now", layerName: "domain" } }],
      },
    ],
  });
  assert.ok(true);
});
