"use strict";

module.exports = {
  configs: {
    defineLayerStructureOptions: require("./configs/layer-structure").defineLayerStructureOptions,
  },
  rules: {
    "barrel-boundary": require("./rules/barrel-boundary"),
    "dangerous-api": require("./rules/dangerous-api"),
    "directory-export-name": require("./rules/directory-export-name"),
    "dto-export-name": require("./rules/dto-export-name"),
    "explicit-public-surface": require("./rules/explicit-public-surface"),
    "forbidden-relative-depth": require("./rules/forbidden-relative-depth"),
    "framework-leakage": require("./rules/framework-leakage"),
    "hooks-export-name": require("./rules/hooks-export-name"),
    "layer-import-direction": require("./rules/layer-import-direction"),
    "layer-structure": require("./rules/layer-structure"),
    "name-responsibility-match": require("./rules/name-responsibility-match"),
    "no-cross-layer-instantiation": require("./rules/no-cross-layer-instantiation"),
    "no-empty-catch-or-swallow": require("./rules/no-empty-catch-or-swallow"),
    "no-inline-implementation-in-interface-layer": require("./rules/no-inline-implementation-in-interface-layer"),
    "no-todo-shipping": require("./rules/no-todo-shipping"),
    "presentation-export-name": require("./rules/presentation-export-name"),
    "testability-guard": require("./rules/testability-guard"),
    "usecase-export-name": require("./rules/usecase-export-name"),
  },
};
