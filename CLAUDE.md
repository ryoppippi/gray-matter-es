# CLAUDE.md

## Project Overview

This is an ESM-only port of [gray-matter](https://github.com/jonschlinkert/gray-matter) - a library for parsing front-matter from strings or files.

## Tech Stack

- **Build**: tsdown
- **Test**: vitest (in-source testing)
- **YAML**: @std/yaml (from JSR, bundled)
- **Type Check**: tsgo (typescript-go)

## Testing

This project uses in-source vitest tests. Tests are written at the bottom of source files using:

```typescript
if (import.meta.vitest) {
  describe("my module", () => {
    it("should work", () => {
      expect(true).toBe(true);
    });
  });
}
```

**Important**: Do NOT destructure from `import.meta.vitest`. The test globals (`describe`, `it`, `expect`, etc.) are available globally via `vitest/globals`.

## Commands

- `pnpm run test` - Run tests
- `pnpm run typecheck` - Type check with tsgo
- `pnpm run build` - Build with tsdown
- `pnpm run lint` - Lint with oxlint

## TypeScript Patterns

### Use `as const satisfies` for Object/Function Definitions

When defining objects or functions that should conform to a type while preserving literal types, use `as const satisfies`:

```typescript
// Good - preserves literal types while ensuring type conformance
const engines = {
  yaml,
  json,
  javascript,
} as const satisfies Engines;

const ALIASES = {
  js: "javascript",
  yaml: "yaml",
  yml: "yaml",
} as const satisfies Record<string, BuiltinLanguage>;

// Avoid - loses literal type information
const engines: Engines = { yaml, json, javascript };
```

## Dependency Management

All dependencies MUST be managed via pnpm catalog in `pnpm-workspace.yaml`:

```yaml
catalogs:
  dev:
    "@types/node": ^24.0.3
    tsdown: ^0.19.0
    vitest: ^4.0.15
  jsr:
    "@std/yaml": jsr:@std/yaml@^1
  release:
    bumpp: ^10.2.3
```

In `package.json`, reference catalogs:

```json
{
  "devDependencies": {
    "@std/yaml": "catalog:jsr",
    "@types/node": "catalog:dev",
    "tsdown": "catalog:dev"
  }
}
```

**Never** add dependencies directly with version numbers in `package.json`. Always:

1. Add the version to the appropriate catalog in `pnpm-workspace.yaml`
2. Reference it with `catalog:<catalog-name>` in `package.json`

## JSR Dependencies

JSR packages (like `@std/yaml`) use the `jsr:` protocol in the catalog:

```yaml
catalogs:
  jsr:
    "@std/yaml": jsr:@std/yaml@^1
```
