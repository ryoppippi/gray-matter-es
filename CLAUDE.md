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
- `pnpm run build` - Build with tsdown
- `pnpm run lint` - Lint with oxlint(including typecheck)

## Development Environment

Use `nix develop` to enter the development shell. This provides all required tools including `tsgo`.

## Dependency Management (Critical)

All dependencies MUST be managed via **pnpm catalog** in `pnpm-workspace.yaml`. **Never** add dependencies directly with version numbers in `package.json`.

1. Add the version to the appropriate catalog in `pnpm-workspace.yaml`
2. Reference it with `catalog:<catalog-name>` in `package.json`

## Additional Rules

| File                                             | Description                                               |
| ------------------------------------------------ | --------------------------------------------------------- |
| [git.md](.claude/rules/git.md)                   | Git workflow with pre-commit hooks                        |
| [testing.md](.claude/rules/testing.md)           | In-source testing, property-based testing with fast-check |
| [dependencies.md](.claude/rules/dependencies.md) | Catalog structure examples, JSR dependencies              |
