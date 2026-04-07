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
      "mm/hooks-export-name": "error",
      "mm/presentation-export-name": "error",
      "mm/usecase-export-name": "error",
    },
  },
];
```

## Rules

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

## Development

```bash
npm test
```

To preview the published tarball contents:

```bash
npm pack --dry-run
```
