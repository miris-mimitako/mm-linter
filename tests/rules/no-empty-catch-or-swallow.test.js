"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/no-empty-catch-or-swallow");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

test("no-empty-catch-or-swallow rule", () => {
  const tester = new RuleTester();
  tester.run("no-empty-catch-or-swallow", rule, {
    valid: [
      { code: "try { a(); } catch (error) { throw error; }" },
    ],
    invalid: [
      {
        code: "try { a(); } catch (error) {}",
        errors: [{ messageId: "emptyCatchOrSwallow" }],
      },
      {
        code: "function run() { try { a(); } catch (error) { console.error(error); return null; } }",
        errors: [{ messageId: "emptyCatchOrSwallow" }],
      },
    ],
  });
  assert.ok(true);
});
