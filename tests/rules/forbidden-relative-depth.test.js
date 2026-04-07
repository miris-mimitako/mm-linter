"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/forbidden-relative-depth");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

test("forbidden-relative-depth rule", () => {
  const tester = new RuleTester();
  tester.run("forbidden-relative-depth", rule, {
    valid: [
      { code: "import x from '../a';", options: [{ maxDepth: 2 }] },
      { code: "const x = require('../../a');", options: [{ maxDepth: 2 }] },
    ],
    invalid: [
      {
        code: "import x from '../../../a';",
        options: [{ maxDepth: 2 }],
        errors: [{ messageId: "forbiddenRelativeDepth", data: { depth: 3, maxDepth: 2 } }],
      },
    ],
  });
  assert.ok(true);
});
