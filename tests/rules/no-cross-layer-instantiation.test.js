"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/no-cross-layer-instantiation");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

const options = {
  rootDirs: ["src"],
  aliases: ["@"],
  layers: { domain: {}, application: {}, infrastructure: {}, presentation: {} },
  forbidden: { application: ["presentation"], domain: ["infrastructure"] },
};

test("no-cross-layer-instantiation rule", () => {
  const tester = new RuleTester();
  tester.run("no-cross-layer-instantiation", rule, {
    valid: [
      {
        filename: "/project/src/application/usecases/x.ts",
        code: "import { DomainService } from '@/domain/service'; new DomainService();",
        options: [options],
      },
    ],
    invalid: [
      {
        filename: "/project/src/application/usecases/x.ts",
        code: "import { UserPresenter } from '@/presentation/presenter'; new UserPresenter();",
        options: [options],
        errors: [
          { messageId: "forbiddenCrossLayerInstantiation", data: { className: "UserPresenter", sourceLayerName: "application", targetLayerName: "presentation" } },
        ],
      },
    ],
  });
  assert.ok(true);
});
