"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/explicit-public-surface");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

test("explicit-public-surface rule", () => {
  const tester = new RuleTester();
  tester.run("explicit-public-surface", rule, {
    valid: [
      {
        filename: "/project/src/domain/index.ts",
        code: "export * from './entity';",
      },
    ],
    invalid: [
      {
        filename: "/project/src/domain/entity.ts",
        code: "export class User {}",
        errors: [{ messageId: "explicitPublicSurface", data: { entryFiles: "index.ts, index.js" } }],
      },
    ],
  });
  assert.ok(true);
});
