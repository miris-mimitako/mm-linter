"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/dangerous-api");

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
});

const options = {
  rootDirs: ["src"],
  layers: {
    domain: {
      deny: ["Date.now", "Math.random", "fetch", "process.env"],
    },
    application: {
      deny: ["console.log"],
    },
    infrastructure: {},
  },
};

test("dangerous-api rule", () => {
  const ruleTester = new RuleTester();

  ruleTester.run("dangerous-api", rule, {
    valid: [
      {
        filename: "/project/src/domain/entities/user.entity.ts",
        code: "const createdAt = clock.now();",
        options: [options],
      },
      {
        filename: "/project/src/application/usecases/create-user.usecase.ts",
        code: "logger.info('created');",
        options: [options],
      },
      {
        filename: "/project/src/infrastructure/repositories/user.repository.ts",
        code: "const random = Math.random();",
        options: [options],
      },
      {
        filename: "/project/test/domain/user.entity.ts",
        code: "const now = Date.now();",
        options: [options],
      },
    ],
    invalid: [
      {
        filename: "/project/src/domain/entities/user.entity.ts",
        code: "const now = Date.now();",
        options: [options],
        errors: [
          {
            messageId: "dangerousApiUse",
            data: {
              apiName: "Date.now",
              layerName: "domain",
            },
          },
        ],
      },
      {
        filename: "/project/src/domain/entities/user.entity.ts",
        code: "const value = Math.random();",
        options: [options],
        errors: [
          {
            messageId: "dangerousApiUse",
            data: {
              apiName: "Math.random",
              layerName: "domain",
            },
          },
        ],
      },
      {
        filename: "/project/src/domain/entities/user.entity.ts",
        code: "const response = fetch('/users');",
        options: [options],
        errors: [
          {
            messageId: "dangerousApiUse",
            data: {
              apiName: "fetch",
              layerName: "domain",
            },
          },
        ],
      },
      {
        filename: "/project/src/domain/entities/user.entity.ts",
        code: "const mode = process.env.NODE_ENV;",
        options: [options],
        errors: [
          {
            messageId: "dangerousApiUse",
            data: {
              apiName: "process.env",
              layerName: "domain",
            },
          },
        ],
      },
      {
        filename: "/project/src/application/usecases/create-user.usecase.ts",
        code: "console.log('debug');",
        options: [options],
        errors: [
          {
            messageId: "dangerousApiUse",
            data: {
              apiName: "console.log",
              layerName: "application",
            },
          },
        ],
      },
    ],
  });

  assert.ok(true);
});
