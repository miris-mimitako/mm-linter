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
      "mm/hooks-export-name": "error",
    },
  },
];
```

## Rules

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
