"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/layer-import-direction");

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
});

const options = {
  rootDirs: ["src"],
  aliases: ["@"],
  layers: {
    domain: {},
    application: {},
    infrastructure: {},
    presentation: {},
  },
  forbidden: {
    domain: ["application", "infrastructure", "presentation"],
    application: ["infrastructure", "presentation"],
  },
};

test("layer-import-direction rule", () => {
  const ruleTester = new RuleTester();

  ruleTester.run("layer-import-direction", rule, {
    valid: [
      {
        filename: "/project/src/domain/entities/user.entity.ts",
        code: "import { Email } from '../shared/email.vo';",
        options: [options],
      },
      {
        filename: "/project/src/application/usecases/create-user.usecase.ts",
        code: "import { User } from '@/domain/entities/user.entity';",
        options: [options],
      },
      {
        filename: "/project/src/presentation/controllers/user.controller.ts",
        code: "import { createUser } from 'src/application/usecases/create-user.usecase';",
        options: [options],
      },
      {
        filename: "/project/test/domain/user.entity.ts",
        code: "import { Repo } from '@/infrastructure/repositories/user.repo';",
        options: [options],
      },
    ],
    invalid: [
      {
        filename: "/project/src/domain/entities/user.entity.ts",
        code: "import { UserRepository } from '../../infrastructure/repositories/user.repository';",
        options: [options],
        errors: [
          {
            messageId: "forbiddenLayerImport",
            data: {
              importSource: "../../infrastructure/repositories/user.repository",
              sourceLayerName: "domain",
              targetLayerName: "infrastructure",
            },
          },
        ],
      },
      {
        filename: "/project/src/domain/entities/user.entity.ts",
        code: "export { createUser } from '@/application/usecases/create-user.usecase';",
        options: [options],
        errors: [
          {
            messageId: "forbiddenLayerImport",
            data: {
              importSource: "@/application/usecases/create-user.usecase",
              sourceLayerName: "domain",
              targetLayerName: "application",
            },
          },
        ],
      },
      {
        filename: "/project/src/application/usecases/create-user.usecase.ts",
        code: "const presenter = require('@/presentation/controllers/user.controller');",
        options: [options],
        errors: [
          {
            messageId: "forbiddenLayerImport",
            data: {
              importSource: "@/presentation/controllers/user.controller",
              sourceLayerName: "application",
              targetLayerName: "presentation",
            },
          },
        ],
      },
    ],
  });

  assert.ok(true);
});
