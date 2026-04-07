"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/dto-export-name");

RuleTester.setDefaultConfig({
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
});

test("dto-export-name rule", () => {
  const ruleTester = new RuleTester();

  ruleTester.run("dto-export-name", rule, {
    valid: [
      {
        filename: "/project/src/dto/user-dto.js",
        code: "export function UserDto() { return null; }",
      },
      {
        filename: "/project/src/dto/session-dto.js",
        code: "export const SessionDto = () => null;",
      },
      {
        filename: "/project/src/dto/feature-dto.js",
        code: "const helper = () => null; export const FeatureDto = helper;",
      },
      {
        filename: "/project/src/dto/user-dto.js",
        code: "export class UserDto {}",
      },
      {
        filename: "/project/src/dto/session-dto.js",
        code: "export const SessionDto = class SessionDto {};",
      },
      {
        filename: "/project/src/dto/default-dto.js",
        code: "export default class DefaultUserDto {}",
      },
      {
        filename: "/project/src/utils/dto.ts",
        code: "export function helper() { return null; }",
      },
      {
        filename: "/project/src/dto/things.js",
        code: "function helper() { return null; } export { helper };",
      },
    ],
    invalid: [
      {
        filename: "/project/src/dto/user.js",
        code: "export function user() { return null; }",
        errors: [
          {
            messageId: "invalidDtoExportName",
            data: { name: "user" },
          },
        ],
      },
      {
        filename: "/project/src/dto/session.js",
        code: "export const session = () => null;",
        errors: [
          {
            messageId: "invalidDtoExportName",
            data: { name: "session" },
          },
        ],
      },
      {
        filename: "/project/src/dto/mixed.js",
        code: "export const UserDto = () => null, badFactory = () => null;",
        errors: [
          {
            messageId: "invalidDtoExportName",
            data: { name: "badFactory" },
          },
        ],
      },
      {
        filename: "/project/src/dto/user.js",
        code: "export class User {}",
        errors: [
          {
            messageId: "invalidDtoExportName",
            data: { name: "User" },
          },
        ],
      },
      {
        filename: "/project/src/dto/default.js",
        code: "export default class {}",
        errors: [
          {
            messageId: "missingDtoExportName",
          },
        ],
      },
    ],
  });

  assert.ok(true);
});
