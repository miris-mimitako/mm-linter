"use strict";

const { createDirectoryExportNameRule } = require("./helpers/directory-export-name-rule");

module.exports = createDirectoryExportNameRule({
  directoryName: "presentation",
  description: "Require exported functions in presentation directories to use the XxxPresentation naming convention",
  isAllowedName(name) {
    return /Presentation$/.test(name);
  },
  messageId: "invalidPresentationExportName",
  message:
    "Exported presentation factories in a presentation directory must be named XxxPresentation. '{{name}}' is not allowed.",
});
