"use strict";

module.exports = {
  configs: {
    defineLayerStructureOptions: require("./configs/layer-structure").defineLayerStructureOptions,
  },
  rules: {
    "dto-export-name": require("./rules/dto-export-name"),
    "hooks-export-name": require("./rules/hooks-export-name"),
    "layer-structure": require("./rules/layer-structure"),
  },
};
