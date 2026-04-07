"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/barrel-boundary");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

test("barrel-boundary rule", () => {
  const tester = new RuleTester();
  tester.run("barrel-boundary", rule, {
    valid: [
      {
        code: "import x from '@/domain';",
        options: [{ boundaries: [{ directoryName: "domain" }] }],
      },
    ],
    invalid: [
      {
        code: "import x from '@/domain/entities/user';",
        options: [{ boundaries: [{ directoryName: "domain" }] }],
        errors: [
          {
            messageId: "internalBoundaryImport",
            data: { directoryName: "domain", importSource: "@/domain/entities/user" },
          },
        ],
      },
    ],
  });
  assert.ok(true);
});
