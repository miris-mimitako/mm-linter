"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/framework-leakage");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

const options = {
  rootDirs: ["src"],
  layers: {
    domain: {
      denyImports: ["react", "express", "@prisma/client", "@nestjs/*"],
    },
    application: {
      denyImports: ["react", "@nestjs/*"],
    },
    infrastructure: {},
  },
};

test("framework-leakage rule", () => {
  const tester = new RuleTester();
  tester.run("framework-leakage", rule, {
    valid: [
      {
        filename: "/project/src/domain/entity.ts",
        code: "import { UserId } from './user-id';",
        options: [options],
      },
      {
        filename: "/project/src/application/usecase.ts",
        code: "import { User } from '@/domain/entity';",
        options: [options],
      },
      {
        filename: "/project/src/infrastructure/repository.ts",
        code: "import { PrismaClient } from '@prisma/client';",
        options: [options],
      },
    ],
    invalid: [
      {
        filename: "/project/src/domain/entity.ts",
        code: "import React from 'react';",
        options: [options],
        errors: [
          {
            messageId: "frameworkLeakage",
            data: { layerName: "domain", packageName: "react" },
          },
        ],
      },
      {
        filename: "/project/src/domain/entity.ts",
        code: "export { PrismaClient } from '@prisma/client';",
        options: [options],
        errors: [
          {
            messageId: "frameworkLeakage",
            data: { layerName: "domain", packageName: "@prisma/client" },
          },
        ],
      },
      {
        filename: "/project/src/application/usecase.ts",
        code: "const common = require('@nestjs/common');",
        options: [options],
        errors: [
          {
            messageId: "frameworkLeakage",
            data: { layerName: "application", packageName: "@nestjs/common" },
          },
        ],
      },
    ],
  });
  assert.ok(true);
});
