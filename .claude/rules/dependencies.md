---
paths:
  - "package.json"
  - "pnpm-workspace.yaml"
---

# Dependency Management Details

## Catalog Structure Example

```yaml
catalogs:
  dev:
    "@fast-check/vitest": ^0.2.0
    tsdown: ^0.19.0
    vitest: ^4.0.15
  jsr:
    "@std/yaml": jsr:@std/yaml@^1
  release:
    bumpp: ^10.2.3
```

## package.json Reference Example

```json
{
  "devDependencies": {
    "@fast-check/vitest": "catalog:dev",
    "@std/yaml": "catalog:jsr",
    "tsdown": "catalog:dev"
  }
}
```

## JSR Dependencies

JSR packages (like `@std/yaml`) use the `jsr:` protocol in the catalog:

```yaml
catalogs:
  jsr:
    "@std/yaml": jsr:@std/yaml@^1
```

## Version Check

When adding new dependencies, **always verify the latest version** using:

```bash
npm view <package-name> version
```

Do not assume or guess version numbers.
