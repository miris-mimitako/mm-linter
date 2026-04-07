# mm-linter

Custom ESLint rules for Miris projects.

## Installation

```bash
npm install --save-dev mm-linter eslint
```

## Usage

Flat config example:

```js
const mmLinter = require("mm-linter");

module.exports = [
  {
    plugins: {
      mm: mmLinter,
    },
    rules: {
      "mm/barrel-boundary": ["error", {
        boundaries: [{ directoryName: "domain" }],
      }],
      "mm/dangerous-api": ["error", {
        rootDirs: ["src"],
        layers: {
          domain: {
            deny: ["Date.now", "Math.random", "fetch", "process.env"],
          },
          application: {
            deny: ["console.log"],
          },
        },
      }],
      "mm/directory-export-name": ["error", {
        targets: [
          {
            directoryName: "factory",
            pattern: "Factory$",
            format: "XxxFactory",
          },
        ],
      }],
      "mm/dto-export-name": "error",
      "mm/explicit-public-surface": "error",
      "mm/forbidden-relative-depth": ["error", { maxDepth: 2 }],
      "mm/hooks-export-name": "error",
      "mm/layer-import-direction": ["error", {
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
      }],
      "mm/name-responsibility-match": ["error", {
        targets: [
          {
            suffix: "Usecase",
            allowedDirectories: ["usecases"],
            requiredMethods: ["execute"],
          },
        ],
      }],
      "mm/no-cross-layer-instantiation": ["error", {
        rootDirs: ["src"],
        aliases: ["@"],
        layers: {
          application: {},
          presentation: {},
        },
        forbidden: {
          application: ["presentation"],
        },
      }],
      "mm/no-empty-catch-or-swallow": "error",
      "mm/no-inline-implementation-in-interface-layer": ["error", {
        layers: {
          presentation: {
            maxStatements: 2,
          },
        },
      }],
      "mm/no-todo-shipping": "error",
      "mm/presentation-export-name": "error",
      "mm/testability-guard": "error",
      "mm/usecase-export-name": "error",
    },
  },
];
```

## Rules

### `mm/dangerous-api`

Disallows risky APIs by layer.

Example:

```js
"mm/dangerous-api": ["error", {
  rootDirs: ["src"],
  layers: {
    domain: {
      deny: ["Date.now", "Math.random", "fetch", "process.env"],
    },
    application: {
      deny: ["console.log"],
    },
  },
}]
```

This rule checks:

- function calls like `fetch()`
- member calls like `Date.now()`
- member access like `process.env`
- constructor calls like `new Date()`

### `mm/barrel-boundary`

Requires imports to go through configured barrel directories.

### `mm/forbidden-relative-depth`

Disallows overly deep relative imports like `../../../x`.

### `mm/name-responsibility-match`

Checks that names like `*Usecase` or `*Repository` are placed in the right directory and define required methods.

### `mm/no-inline-implementation-in-interface-layer`

Limits inline statement count in interface-layer handlers such as presentation or controllers.

### `mm/no-cross-layer-instantiation`

Disallows `new` on classes imported from forbidden layers.

### `mm/testability-guard`

Disallows test-hostile APIs such as `Date.now()` or `Math.random()` in core layers.

### `mm/no-todo-shipping`

Disallows shipping comments like `TODO`, `FIXME`, or `temporary`.

### `mm/no-empty-catch-or-swallow`

Disallows empty catch blocks and obvious swallowed errors.

### `mm/explicit-public-surface`

Restricts exports to explicit entry files such as `index.ts`.

### `mm/directory-export-name`

Configurable rule for exported function names in arbitrary directories.

Example:

```js
"mm/directory-export-name": ["error", {
  targets: [
    {
      directoryName: "factory",
      pattern: "Factory$",
      format: "XxxFactory",
    },
    {
      directoryName: "presenter",
      pattern: "Presenter$",
      format: "XxxPresenter",
      subject: "presenters",
    },
  ],
}]
```

### `mm/dto-export-name`

Requires exported functions in `dto` directories to use the `XxxDto` naming convention.

Checked targets:

- `export function ...`
- `export const ...`

Only files whose path includes `/dto/` are checked.

Valid:

```js
export function UserDto() {
  return null;
}

export const SessionDto = () => null;
```

Invalid:

```js
export function user() {
  return null;
}

export const session = () => null;
```

Non-exported helper functions are allowed.

### `mm/presentation-export-name`

Requires exported functions in `presentation` directories to use the `XxxPresentation` naming convention.

Checked targets:

- `export function ...`
- `export const ...`

Only files whose path includes `/presentation/` are checked.

### `mm/usecase-export-name`

Requires exported functions in `usecase` directories to use the `XxxUsecase` naming convention.

Checked targets:

- `export function ...`
- `export const ...`

Only files whose path includes `/usecase/` are checked.

### `mm/hooks-export-name`

Requires exported functions in `hooks` directories to use the `useXxx` naming convention.

Checked targets:

- `export function ...`
- `export const ...`

Only files whose path includes `/hooks/` are checked.

Valid:

```js
export function useAuth() {
  return null;
}

export const useSession = () => null;
```

Invalid:

```js
export function auth() {
  return null;
}

export const session = () => null;
```

Non-exported helper functions are allowed.

### `mm/layer-structure`

Enforces directory names, file names, and function names for each architecture layer.

Example:

```js
const mmLinter = require("mm-linter");

module.exports = [
  {
    plugins: {
      mm: mmLinter,
    },
    rules: {
      "mm/layer-structure": ["error", {
        rootDirs: ["src"],
        denyLayers: ["presentation"],
        layers: {
          domain: {
            directories: {
              allow: ["entities", "services", "shared"],
              deny: ["controllers", "hooks"],
            },
            files: {
              allow: ["*.entity.ts", "*.service.ts", "index.ts"],
              deny: ["*.controller.ts", "*.hook.ts"],
            },
            functions: {
              allow: ["create*", "rebuild*", "validate*"],
              deny: ["use*", "handle*", "render*"],
            },
          },
          infrastructure: {
            enabled: false,
          },
        },
      }],
    },
  },
];
```

To lock the base policy and only allow selected overrides, use the config helper:

```js
const mmLinter = require("mm-linter");

const layerOptions = mmLinter.configs.defineLayerStructureOptions(
  {
    locked: true,
    customization: {
      allowNewLayers: false,
      allowAllowRules: false,
      allowDenyRules: true,
    },
    layers: {
      domain: {
        files: {
          allow: ["*.entity.ts"],
          deny: ["*.controller.ts"],
        },
      },
    },
  },
  {
    denyLayers: ["presentation"],
  }
);
```

### `mm/layer-import-direction`

Enforces forbidden import directions between layers.

Example:

```js
"mm/layer-import-direction": ["error", {
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
}]
```

This rule checks:

- `import ... from "..."` 
- `export ... from "..."` 
- `require("...")`

## Development

```bash
npm test
```

To preview the published tarball contents:

```bash
npm pack --dry-run
```
