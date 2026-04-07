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

## Development

```bash
npm test
```

To preview the published tarball contents:

```bash
npm pack --dry-run
```
