"use strict";

const { createDirectoryExportNameRule } = require("./helpers/directory-export-name-rule");

module.exports = createDirectoryExportNameRule({
  directoryName: "dto",
  description: "Require exported functions in dto directories to use the XxxDto naming convention",
  isAllowedName(name) {
    return /Dto$/.test(name);
  },
  messageId: "invalidDtoExportName",
  message: "Exported DTO factories in a dto directory must be named XxxDto. '{{name}}' is not allowed.",
});
