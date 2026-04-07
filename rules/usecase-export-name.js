"use strict";

const { createDirectoryExportNameRule } = require("./helpers/directory-export-name-rule");

module.exports = createDirectoryExportNameRule({
  directoryName: "usecase",
  description: "Require exported functions in usecase directories to use the XxxUsecase naming convention",
  isAllowedName(name) {
    return /Usecase$/.test(name);
  },
  messageId: "invalidUsecaseExportName",
  message:
    "Exported usecase factories in a usecase directory must be named XxxUsecase. '{{name}}' is not allowed.",
});
