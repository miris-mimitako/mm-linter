"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/layer-structure");
const { defineLayerStructureOptions } = require("../../configs/layer-structure");

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
});

const baseOptions = {
  rootDirs: ["src"],
  layers: {
    domain: {
      directories: {
        allow: ["entities", "services", "shared"],
        deny: ["controllers", "hooks"],
      },
      files: {
        allow: ["*.entity.ts", "*.service.ts", "index.ts"],
        deny: ["*.controller.ts", "*.hook.ts"],
      },
      functions: {
        allow: ["create*", "rebuild*", "validate*"],
        deny: ["use*", "handle*", "render*"],
      },
    },
    application: {
      directories: {
        allow: ["usecases", "shared"],
      },
      files: {
        allow: ["*.usecase.ts", "index.ts"],
      },
      functions: {
        allow: ["execute*", "handle*"],
        deny: ["use*"],
      },
    },
    infrastructure: {
      enabled: false,
    },
  },
};

test("layer-structure rule", () => {
  const ruleTester = new RuleTester();

  ruleTester.run("layer-structure", rule, {
    valid: [
      {
        filename: "/project/src/domain/entities/user.entity.ts",
        code: "export function createUser() { return null; }",
        options: [baseOptions],
      },
      {
        filename: "/project/src/application/usecases/create-user.usecase.ts",
        code: "export function executeCreateUser() { return null; }",
        options: [baseOptions],
      },
      {
        filename: "/project/test/domain/entities/user.entity.ts",
        code: "export function anyName() { return null; }",
        options: [baseOptions],
      },
    ],
    invalid: [
      {
        filename: "/project/src/domain/controllers/user.entity.ts",
        code: "export function createUser() { return null; }",
        options: [baseOptions],
        errors: [
          {
            messageId: "deniedDirectoryName",
            data: { layerName: "domain", value: "controllers" },
          },
        ],
      },
      {
        filename: "/project/src/domain/entities/user.controller.ts",
        code: "export function createUser() { return null; }",
        options: [baseOptions],
        errors: [
          {
            messageId: "deniedFileName",
            data: { layerName: "domain", value: "user.controller.ts" },
          },
        ],
      },
      {
        filename: "/project/src/domain/entities/user.entity.ts",
        code: "export function handleUser() { return null; }",
        options: [baseOptions],
        errors: [
          {
            messageId: "deniedFunctionName",
            data: { layerName: "domain", value: "handleUser" },
          },
        ],
      },
      {
        filename: "/project/src/infrastructure/repositories/user.repository.ts",
        code: "export function saveUser() { return null; }",
        options: [baseOptions],
        errors: [
          {
            messageId: "disabledLayer",
            data: { layerName: "infrastructure" },
          },
        ],
      },
      {
        filename: "/project/src/application/usecases/create-user.usecase.ts",
        code: "export const createUser = () => null;",
        options: [
          {
            ...baseOptions,
            denyLayers: ["application"],
          },
        ],
        errors: [
          {
            messageId: "deniedLayer",
            data: { layerName: "application" },
          },
        ],
      },
    ],
  });

  assert.ok(true);
});

test("defineLayerStructureOptions merges allowed overrides", () => {
  const merged = defineLayerStructureOptions(
    {
      locked: true,
      customization: {
        allowNewLayers: false,
        allowAllowRules: false,
        allowDenyRules: true,
      },
      layers: {
        domain: {
          files: {
            allow: ["*.entity.ts"],
            deny: ["*.controller.ts"],
          },
        },
      },
    },
    {
      denyLayers: ["presentation"],
      layers: {
        domain: {
          files: {
            deny: ["*.view.ts"],
          },
        },
      },
    }
  );

  assert.deepEqual(merged.layers.domain.files.allow, ["*.entity.ts"]);
  assert.deepEqual(merged.layers.domain.files.deny, ["*.view.ts"]);
  assert.deepEqual(merged.denyLayers, ["presentation"]);
});

test("defineLayerStructureOptions blocks denied overrides", () => {
  assert.throws(
    () =>
      defineLayerStructureOptions(
        {
          locked: true,
          customization: {
            allowNewLayers: false,
            allowAllowRules: false,
            allowDenyRules: true,
          },
          layers: {
            domain: {},
          },
        },
        {
          layers: {
            application: {},
          },
        }
      ),
    /Adding a new layer is denied/
  );

  assert.throws(
    () =>
      defineLayerStructureOptions(
        {
          locked: true,
          customization: {
            allowNewLayers: false,
            allowAllowRules: false,
            allowDenyRules: true,
          },
          layers: {
            domain: {
              files: {
                allow: ["*.entity.ts"],
              },
            },
          },
        },
        {
          layers: {
            domain: {
              files: {
                allow: ["*.service.ts"],
              },
            },
          },
        }
      ),
    /domain\.files\.allow is denied/
  );
});
