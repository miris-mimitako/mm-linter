"use strict";

module.exports = {
  configs: {
    defineLayerStructureOptions: require("./configs/layer-structure").defineLayerStructureOptions,
  },
  rules: {
    "directory-export-name": require("./rules/directory-export-name"),
    "dto-export-name": require("./rules/dto-export-name"),
    "hooks-export-name": require("./rules/hooks-export-name"),
    "layer-structure": require("./rules/layer-structure"),
    "presentation-export-name": require("./rules/presentation-export-name"),
    "usecase-export-name": require("./rules/usecase-export-name"),
  },
};
