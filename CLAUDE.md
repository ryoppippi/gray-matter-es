# CLAUDE.md

## Language

Use **US English** spelling in this project (e.g., "initialize", "serialize", "color"). This is enforced by `typos` in pre-commit hooks.

## Project Overview

This is an ESM-only port of [gray-matter](https://github.com/jonschlinkert/gray-matter) - a library for parsing front-matter from strings or files.

## Tech Stack

- **Build**: tsdown
- **Test**: vitest (in-source testing)
- **YAML**: @std/yaml (from JSR, bundled)
- **Type Check**: tsgo (typescript-go)

## Commands

- `pnpm run test` - Run tests
- `pnpm run typecheck` - Type check with tsgo
- `pnpm run build` - Build with tsdown
- `pnpm run lint` - Lint with oxlint

## Testing (Critical)

This project uses **in-source vitest tests**. Tests are written at the bottom of source files:

```typescript
if (import.meta.vitest) {
  describe("my module", () => {
    it("should work", () => {
      expect(true).toBe(true);
    });
  });
}
```

**Important**: Do NOT destructure from `import.meta.vitest`. Test globals are available via `vitest/globals`.

## Dependency Management (Critical)

All dependencies MUST be managed via **pnpm catalog** in `pnpm-workspace.yaml`. **Never** add dependencies directly with version numbers in `package.json`.

1. Add the version to the appropriate catalog in `pnpm-workspace.yaml`
2. Reference it with `catalog:<catalog-name>` in `package.json`

## Additional Rules

| File                                                           | Description                                             |
| -------------------------------------------------------------- | ------------------------------------------------------- |
| [testing.md](.claude/rules/testing.md)                         | Property-based testing with fast-check                  |
| [typescript-patterns.md](.claude/rules/typescript-patterns.md) | `as` assertions, `as const satisfies`, nullish patterns |
| [dependencies.md](.claude/rules/dependencies.md)               | Catalog structure examples, JSR dependencies            |
