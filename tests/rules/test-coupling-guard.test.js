"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/test-coupling-guard");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

const options = {
  testFilePatterns: [".test.", ".spec."],
  maxInternalDepth: 3,
  denyImportSegments: ["internal", "private", "impl"],
};

test("test-coupling-guard rule", () => {
  const tester = new RuleTester();
  tester.run("test-coupling-guard", rule, {
    valid: [
      {
        filename: "/project/src/user.test.ts",
        code: "import { createUser } from '@/application';",
        options: [options],
      },
    ],
    invalid: [
      {
        filename: "/project/src/user.test.ts",
        code: "import { createUser } from '@/application/usecases/internal/create-user';",
        options: [options],
        errors: [
          {
            messageId: "testCouplingDepth",
            data: { importSource: "@/application/usecases/internal/create-user" },
          },
          {
            messageId: "testCouplingSegment",
            data: { importSource: "@/application/usecases/internal/create-user", segment: "internal" },
          },
        ],
      },
      {
        filename: "/project/src/user.spec.ts",
        code: "const repo = require('@/repositories/private/user-repository');",
        options: [options],
        errors: [
          {
            messageId: "testCouplingSegment",
            data: { importSource: "@/repositories/private/user-repository", segment: "private" },
          },
        ],
      },
    ],
  });
  assert.ok(true);
});
