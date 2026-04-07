"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/dependency-injection-enforcement");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

const options = {
  rootDirs: ["src"],
  layers: {
    application: {
      denyNew: ["*Repository", "*RepositoryImpl", "*Client", "*Service"],
    },
    presentation: {
      denyNew: ["*Usecase", "*Repository", "*Client"],
    },
  },
};

test("dependency-injection-enforcement rule", () => {
  const tester = new RuleTester();
  tester.run("dependency-injection-enforcement", rule, {
    valid: [
      {
        filename: "/project/src/application/usecases/create-user.ts",
        code: "function run(factory) { return factory.createRepository(); }",
        options: [options],
      },
      {
        filename: "/project/src/application/usecases/create-user.ts",
        code: "new UserEntity();",
        options: [options],
      },
    ],
    invalid: [
      {
        filename: "/project/src/application/usecases/create-user.ts",
        code: "new UserRepository();",
        options: [options],
        errors: [
          {
            messageId: "directInstantiationDenied",
            data: { className: "UserRepository", layerName: "application" },
          },
        ],
      },
      {
        filename: "/project/src/presentation/controller.ts",
        code: "new CreateUserUsecase();",
        options: [options],
        errors: [
          {
            messageId: "directInstantiationDenied",
            data: { className: "CreateUserUsecase", layerName: "presentation" },
          },
        ],
      },
    ],
  });
  assert.ok(true);
});
