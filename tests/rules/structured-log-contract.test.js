"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");
const rule = require("../../rules/structured-log-contract");

RuleTester.setDefaultConfig({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

test("structured-log-contract rule", () => {
  const tester = new RuleTester();
  tester.run("structured-log-contract", rule, {
    valid: [
      {
        code: "logger.info({ timestamp: now, applicationName: 'app', level: 'info', description: 'created' });",
      },
      {
        code: "console.error({ timestamp: now, applicationName: 'app', level: 'error', description: 'failed', extra: detail });",
      },
    ],
    invalid: [
      {
        code: "logger.info('created');",
        errors: [
          {
            messageId: "structuredLogObjectRequired",
            data: { callName: "logger.info" },
          },
        ],
      },
      {
        code: "console.log({ applicationName: 'app', level: 'info', description: 'created' });",
        errors: [
          {
            messageId: "structuredLogMissingKey",
            data: { callName: "console.log", keyName: "timestamp" },
          },
        ],
      },
      {
        code: "log.warn({ timestamp: now, applicationName: 'app' });",
        errors: [
          {
            messageId: "structuredLogMissingKey",
            data: { callName: "log.warn", keyName: "level" },
          },
          {
            messageId: "structuredLogMissingKey",
            data: { callName: "log.warn", keyName: "description" },
          },
        ],
      },
    ],
  });
  assert.ok(true);
});
