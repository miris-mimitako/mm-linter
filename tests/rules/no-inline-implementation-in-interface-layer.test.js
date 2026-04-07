"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/no-inline-implementation-in-interface-layer");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

test("no-inline-implementation-in-interface-layer rule", () => {
  const tester = new RuleTester();
  tester.run("no-inline-implementation-in-interface-layer", rule, {
    valid: [
      {
        filename: "/project/src/presentation/controller.ts",
        code: "function handle() { return service.execute(); }",
        options: [{ layers: { presentation: { maxStatements: 2 } } }],
      },
    ],
    invalid: [
      {
        filename: "/project/src/presentation/controller.ts",
        code: "function handle() { a(); b(); c(); }",
        options: [{ layers: { presentation: { maxStatements: 2 } } }],
        errors: [
          { messageId: "tooManyInlineStatements", data: { layerName: "presentation", statementCount: 3, maxStatements: 2 } },
        ],
      },
    ],
  });
  assert.ok(true);
});
