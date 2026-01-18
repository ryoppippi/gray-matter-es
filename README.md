# gray-matter-es

[![npm version](https://img.shields.io/npm/v/gray-matter-es?color=yellow)](https://npmjs.com/package/gray-matter-es)
[![npm downloads](https://img.shields.io/npm/dm/gray-matter-es?color=yellow)](https://npmjs.com/package/gray-matter-es)
[![coverage](https://ryoppippi.github.io/gray-matter-es/badges.svg)](https://ryoppippi.github.io/gray-matter-es/)

ESM-only [gray-matter](https://github.com/jonschlinkert/gray-matter) implementation.

## Features

- 🚀 ESM-only, no CommonJS
- 🌲 Tree-shakable (named exports)
- 🌐 Browser-compatible (no Node.js dependencies)
- 📦 Zero runtime dependencies (YAML parser bundled from [@std/yaml](https://jsr.io/@std/yaml))
- 🔷 Full TypeScript support with strict types
- ✅ API compatible with gray-matter

## Installation

```bash
npm install gray-matter-es
# or
pnpm add gray-matter-es
```

## Usage

```typescript
import * as matter from "gray-matter-es";

// Parse front matter
const file = matter.matter("---\ntitle: Hello\n---\nThis is content");
console.log(file.data); // { title: 'Hello' }
console.log(file.content); // 'This is content'

// Stringify
const str = matter.stringify("content", { title: "Hello" });
// ---
// title: Hello
// ---
// content

// Test if string has front matter
matter.test("---\ntitle: Hello\n---"); // true

// Detect language
matter.language("---json\n{}\n---"); // { raw: 'json', name: 'json' }
```

You can also import individual functions for tree-shaking:

```typescript
import { matter, stringify, test, language, clearCache, cache } from "gray-matter-es";
```

### Custom Delimiters

```typescript
const file = matter("~~~\ntitle: Hello\n~~~\ncontent", {
  delimiters: "~~~",
});
```

### JSON Front Matter

```typescript
const file = matter('---json\n{"title": "Hello"}\n---\ncontent');
console.log(file.data); // { title: 'Hello' }
console.log(file.language); // 'json'
```

### Excerpt

```typescript
const file = matter("---\ntitle: Hello\n---\nexcerpt\n---\ncontent", {
  excerpt: true,
});
console.log(file.excerpt); // 'excerpt\n'
```

## API

### `matter(input, options?)`

Parse front matter from a string or Uint8Array.

**Parameters:**

- `input` - String, Uint8Array, or object with `content` property
- `options` - Optional configuration

**Returns:** `GrayMatterFile` object with:

- `data` - Parsed front matter data
- `content` - Content after front matter
- `excerpt` - Extracted excerpt (if enabled)
- `orig` - Original input as Uint8Array
- `language` - Detected/specified language
- `matter` - Raw front matter string
- `isEmpty` - True if front matter block was empty
- `stringify(data?, options?)` - Stringify the file back

### `stringify(file, data?, options?)`

Stringify data to front matter and append content.

### `test(str, options?)`

Test if a string has front matter.

### `language(str, options?)`

Detect the language specified after the opening delimiter.

### `clearCache()`

Clear the internal cache.

### `cache`

The internal cache (read-only access).

### Options

- `language` - Language to use for parsing (default: `'yaml'`)
- `delimiters` - Custom delimiters (default: `'---'`)
- `excerpt` - Enable excerpt extraction (`true`, string delimiter, or function)
- `excerpt_separator` - Custom excerpt separator
- `engines` - Custom parsing/stringifying engines

## Differences from gray-matter

- ESM-only (no CommonJS support)
- Browser-compatible (no Node.js dependencies)
- Uses [`@std/yaml`](https://jsr.io/@std/yaml) instead of `js-yaml`
- Removed `matter.read()` (use your own file reading)
- Removed JavaScript front matter engine (security: avoids `eval`)
- Removed deprecated options (`lang`, `delims`, `parsers`)
- Removed `section-matter` support
- TypeScript-first with strict types

## Migration from gray-matter

### Import Changes

```diff
- const matter = require('gray-matter');
+ import * as matter from 'gray-matter-es';
```

### API Changes

The main function is now `matter.matter()` instead of `matter()`:

```diff
- const result = matter(str);
+ const result = matter.matter(str);
```

Other methods remain the same:

```typescript
matter.stringify(file, data);
matter.test(str);
matter.language(str);
matter.clearCache();
```

### Removed Features

#### JavaScript Front Matter Engine

The JavaScript engine has been removed for security reasons (it used `eval`). If you were using JavaScript front matter:

```markdown
---js
{
  title: "Hello",
  date: new Date()
}
---
```

You'll need to either:

1. Convert to YAML or JSON front matter
2. Register a custom engine with your own parser

#### Deprecated Options

The following deprecated options have been removed:

| Removed Option | Replacement  |
| -------------- | ------------ |
| `lang`         | `language`   |
| `delims`       | `delimiters` |
| `parsers`      | `engines`    |

```diff
- matter(str, { lang: 'json', delims: '~~~' });
+ matter(str, { language: 'json', delimiters: '~~~' });
```

#### Section Matter

If you were using `section-matter` functionality, you'll need to handle it separately.

### YAML Parser Differences

This library uses `@std/yaml` instead of `js-yaml`. In most cases, this is a drop-in replacement, but there may be edge cases with non-standard YAML.

### CommonJS Users

If you're using CommonJS, you'll need to either:

1. Migrate to ESM
2. Use dynamic import:

```javascript
const { matter } = await import("gray-matter-es");
```

## Development

### Prerequisites

This project uses [Nix](https://nixos.org/) for development environment management. Make sure you have Nix installed with flakes enabled.

### Setup

```bash
# Enter the development shell
nix develop
```

### Commands

```bash
# Run tests
pnpm run test

# Build
pnpm run build

# Lint & typecheck
pnpm run lint
```

## License

MIT
