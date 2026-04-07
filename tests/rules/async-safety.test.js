"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/async-safety");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

test("async-safety rule", () => {
  const tester = new RuleTester();
  tester.run("async-safety", rule, {
    valid: [
      {
        code: "async function run() { await fetch('/users'); }",
      },
      {
        code: "function run() { return service.loadUsers(); }",
      },
      {
        code: "function run() { const promise = repository.saveUser(); }",
      },
      {
        code: "function run() { void executeTaskAsync(); }",
      },
    ],
    invalid: [
      {
        code: "function run() { fetch('/users'); }",
        errors: [{ messageId: "floatingAsyncCall", data: { callName: "fetch" } }],
      },
      {
        code: "function run() { service.loadUsers(); }",
        errors: [{ messageId: "floatingAsyncCall", data: { callName: "service.loadUsers" } }],
      },
      {
        code: "function run() { executeTaskAsync(); }",
        errors: [{ messageId: "floatingAsyncCall", data: { callName: "executeTaskAsync" } }],
      },
    ],
  });
  assert.ok(true);
});
