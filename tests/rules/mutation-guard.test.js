"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/mutation-guard");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

test("mutation-guard rule", () => {
  const tester = new RuleTester();
  tester.run("mutation-guard", rule, {
    valid: [
      {
        code: "class UserValueObject { constructor(value) { this.value = value; } equals(other) { return this.value === other.value; } }",
      },
      {
        code: "class UserEntity { constructor(name) { this.name = name; } rename(nextName) { return nextName; } }",
      },
    ],
    invalid: [
      {
        code: "class UserValueObject { set value(nextValue) { this.value = nextValue; } }",
        errors: [
          { messageId: "publicSetterForbidden", data: { className: "UserValueObject" } },
          { messageId: "thisReassignmentForbidden", data: { className: "UserValueObject", propertyName: "value" } },
        ],
      },
      {
        code: "class UserEntity { constructor(name) { this.name = name; } rename(nextName) { this.name = nextName; } }",
        errors: [
          { messageId: "thisReassignmentForbidden", data: { className: "UserEntity", propertyName: "name" } },
        ],
      },
    ],
  });
  assert.ok(true);
});
