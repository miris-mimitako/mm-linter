"use strict";

const { createDirectoryExportNameRule } = require("./helpers/directory-export-name-rule");

module.exports = createDirectoryExportNameRule({
  directoryName: "hooks",
  description: "Require exported functions in hooks directories to use the useXxx naming convention",
  isAllowedName(name) {
    return /^use[A-Z]/.test(name);
  },
  messageId: "invalidHookExportName",
  message: "Exported hooks in a hooks directory must be named useXxx. '{{name}}' is not allowed.",
});
