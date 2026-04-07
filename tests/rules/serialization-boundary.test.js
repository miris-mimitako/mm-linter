"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/serialization-boundary");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

const options = {
  rootDirs: ["src"],
  layers: {
    domain: {
      deny: ["JSON.stringify", "JSON.parse", "structuredClone"],
    },
    application: {
      deny: ["JSON.stringify", "JSON.parse"],
    },
  },
};

test("serialization-boundary rule", () => {
  const tester = new RuleTester();
  tester.run("serialization-boundary", rule, {
    valid: [
      {
        filename: "/project/src/domain/entity.ts",
        code: "serializer.toJson(user);",
        options: [options],
      },
      {
        filename: "/project/src/infrastructure/http.ts",
        code: "JSON.stringify(payload);",
        options: [options],
      },
    ],
    invalid: [
      {
        filename: "/project/src/domain/entity.ts",
        code: "JSON.stringify(user);",
        options: [options],
        errors: [
          {
            messageId: "serializationBoundaryViolation",
            data: { apiName: "JSON.stringify", layerName: "domain" },
          },
        ],
      },
      {
        filename: "/project/src/application/usecase.ts",
        code: "const user = JSON.parse(text);",
        options: [options],
        errors: [
          {
            messageId: "serializationBoundaryViolation",
            data: { apiName: "JSON.parse", layerName: "application" },
          },
        ],
      },
    ],
  });
  assert.ok(true);
});
