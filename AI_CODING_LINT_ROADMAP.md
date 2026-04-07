# AI Coding Lint Roadmap

This document tracks the next static analysis rules to add for AI-assisted coding quality.

## Goal

The focus is not only syntax correctness. The goal is to prevent code that is:

- structurally valid but architecturally weak
- easy for AI to generate but hard for humans to maintain
- difficult to test
- coupled to frameworks or runtime details in the wrong layers

## Priority Order

1. `framework-leakage`
2. `async-safety`
3. `side-effect-boundary`
4. `naming-consistency-between-file-and-symbol`
5. `dependency-injection-enforcement`
6. `result-error-handling`
7. `mutation-guard`
8. `serialization-boundary`
9. `query-command-separation`
10. `duplicate-role-detection`
11. `comment-contract`
12. `test-coupling-guard`

## Rule Notes

### 1. `framework-leakage`

Purpose:
Prevent framework or library details from leaking into core layers.

Examples:

- `domain` must not import `react`
- `domain` must not import `express`
- `domain` must not import `prisma`
- `application` must not import `react`
- `application` must not import Nest decorators

Minimal implementation:

- inspect `import` / `export ... from` / `require()`
- match imported package names against deny lists by layer

### 2. `async-safety`

Purpose:
Catch promise misuse that AI often introduces.

Examples:

- missing `await`
- floating promises
- unhandled async calls
- `async` functions without `await` where team policy forbids them

Minimal implementation:

- detect promise-returning calls that are not awaited, returned, or explicitly ignored with `void`

### 3. `side-effect-boundary`

Purpose:
Prevent side effects at module load time and outside approved boundaries.

Examples:

- top-level `fetch()`
- top-level `console.log()`
- top-level `process.env` access
- top-level `Date.now()`

Minimal implementation:

- inspect top-level statements only
- reuse dangerous API matching

### 4. `naming-consistency-between-file-and-symbol`

Purpose:
Ensure file names and exported symbol names stay aligned.

Examples:

- `create-user.usecase.ts` should export `CreateUserUsecase`
- `user.presenter.ts` should export `UserPresenter`

Minimal implementation:

- compare normalized file basename with exported class/function names

### 5. `dependency-injection-enforcement`

Purpose:
Prevent ad hoc construction of dependencies where DI or factories are expected.

Examples:

- forbid `new RepositoryImpl()` in usecases
- require factory/provider/constructor injection paths

Minimal implementation:

- inspect `new` expressions by layer and by imported class name patterns

### 6. `result-error-handling`

Purpose:
Make failure handling explicit.

Examples:

- require `Result`/`Either` return in selected directories
- forbid naked `throw` in some application paths

### 7. `mutation-guard`

Purpose:
Protect value-oriented types from uncontrolled mutation.

Examples:

- no public setters on `ValueObject`
- no reassignment of entity invariants after construction

### 8. `serialization-boundary`

Purpose:
Keep serialization concerns at explicit boundaries.

Examples:

- no `JSON.stringify` in domain
- no `JSON.parse` in usecases unless explicitly allowed

### 9. `query-command-separation`

Purpose:
Separate reads from writes.

Examples:

- `*Query` must not mutate state
- `*Command` must not return large read models

### 10. `duplicate-role-detection`

Purpose:
Catch responsibility duplication.

Examples:

- two `CreateUserUsecase` implementations in separate directories
- multiple repository implementations without explicit suffix/purpose

### 11. `comment-contract`

Purpose:
Require concise contracts on public APIs.

Examples:

- public usecase must document input/output expectations
- public repository interface must document persistence contract

### 12. `test-coupling-guard`

Purpose:
Keep tests from depending on unstable internals.

Examples:

- forbid test imports from deep internal paths
- prefer public surface imports in tests

## Implementation Policy

- Every rule must be independently configurable with normal ESLint `off` / `warn` / `error`.
- Every rule should have at least one small RuleTester suite before further expansion.
- Prefer minimal, high-signal checks first. Expand coverage only after the first useful version exists.
