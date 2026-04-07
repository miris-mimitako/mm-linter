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
      "mm/async-safety": "error",
      "mm/barrel-boundary": ["error", {
        boundaries: [{ directoryName: "domain" }],
      }],
      "mm/comment-contract": ["error", {
        targets: [
          {
            directories: ["usecases", "repositories"],
            minDescriptionLength: 12,
          },
        ],
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
      "mm/dependency-injection-enforcement": ["error", {
        rootDirs: ["src"],
        layers: {
          application: {
            denyNew: ["*Repository", "*RepositoryImpl", "*Client", "*Service"],
          },
          presentation: {
            denyNew: ["*Usecase", "*Repository", "*Client"],
          },
        },
      }],
      "mm/duplicate-role-detection": "error",
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
      "mm/framework-leakage": ["error", {
        rootDirs: ["src"],
        layers: {
          domain: {
            denyImports: ["react", "express", "@prisma/client", "@nestjs/*"],
          },
          application: {
            denyImports: ["react", "@nestjs/*"],
          },
        },
      }],
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
      "mm/mutation-guard": "error",
      "mm/naming-consistency-between-file-and-symbol": "error",
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
      "mm/query-command-separation": ["error", {
        targets: [
          {
            directories: ["usecases"],
            queryNamePatterns: ["*Query", "get*", "find*"],
            commandNamePatterns: ["*Command", "execute*", "handle*"],
            mutationCallPatterns: ["repository.save*", "repository.update*", "repository.delete*"],
          },
        ],
      }],
      "mm/result-error-handling": ["error", {
        targets: [
          {
            directories: ["usecases"],
            functionNamePatterns: ["execute*", "handle*"],
            resultCallPatterns: ["Result.*", "ok", "err"],
          },
        ],
      }],
      "mm/serialization-boundary": ["error", {
        rootDirs: ["src"],
        layers: {
          domain: {
            deny: ["JSON.stringify", "JSON.parse", "structuredClone"],
          },
          application: {
            deny: ["JSON.stringify", "JSON.parse"],
          },
        },
      }],
      "mm/test-coupling-guard": ["error", {
        testFilePatterns: [".test.", ".spec."],
        maxInternalDepth: 3,
        denyImportSegments: ["internal", "private", "impl"],
      }],
      "mm/structured-log-contract": ["error", {
        targets: ["console.*", "logger.*", "log.*"],
        requiredKeys: ["timestamp", "applicationName", "level", "description"],
      }],
      "mm/side-effect-boundary": ["error", {
        rootDirs: ["src"],
        layers: {
          domain: {
            deny: ["fetch", "console.log", "process.env", "Date.now"],
          },
          application: {
            deny: ["console.log"],
          },
        },
      }],
      "mm/testability-guard": "error",
      "mm/usecase-export-name": "error",
    },
  },
];
```

## Rules

### `mm/async-safety`

Disallows floating async or promise-returning calls unless they are awaited, returned, assigned, or explicitly ignored with `void`.

### `mm/dependency-injection-enforcement`

Disallows direct `new` of configured dependency roles in selected layers, so DI or factory/provider paths are used instead.

### `mm/duplicate-role-detection`

Detects duplicate exported role names such as repeated `*Usecase` or `*Repository` implementations within the same lint run.

### `mm/comment-contract`

Requires a minimal JSDoc contract comment on exported APIs in selected directories.

### `mm/test-coupling-guard`

Restricts tests from importing deep internal implementation paths instead of stable public surfaces.

### `mm/structured-log-contract`

Requires log calls to emit an object payload containing at least `timestamp`, `applicationName`, `level`, and `description`.

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

### `mm/framework-leakage`

Disallows framework and library imports in restricted layers such as `domain` or `application`.

### `mm/side-effect-boundary`

Disallows top-level side effects such as `fetch()`, `console.log()`, `process.env`, or `Date.now()` in restricted layers.

### `mm/result-error-handling`

Requires selected exported functions to return a Result-style value and avoid direct `throw`.

### `mm/serialization-boundary`

Disallows direct `JSON.stringify`, `JSON.parse`, and similar serialization APIs in restricted layers.

### `mm/query-command-separation`

Ensures queries stay read-only and commands do not directly return object or array read models.

### `mm/mutation-guard`

Disallows public setters on `*ValueObject` and prevents `this.x = ...` reassignment outside constructors for selected class roles.

### `mm/naming-consistency-between-file-and-symbol`

Ensures exported symbol names stay aligned with the file basename.

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
