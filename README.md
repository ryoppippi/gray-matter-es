# gray-matter-es

ESM-only [gray-matter](https://github.com/jonschlinkert/gray-matter) implementation.

## Features

- 🚀 ESM-only, no CommonJS
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
import matter from "gray-matter-es";

// Parse front matter
const file = matter("---\ntitle: Hello\n---\nThis is content");
console.log(file.data); // { title: 'Hello' }
console.log(file.content); // 'This is content'

// Stringify
const str = matter.stringify("content", { title: "Hello" });
// ---
// title: Hello
// ---
// content

// Read from file (Node.js)
const fileFromDisk = matter.read("./post.md");

// Test if string has front matter
matter.test("---\ntitle: Hello\n---"); // true

// Detect language
matter.language("---json\n{}\n---"); // { raw: 'json', name: 'json' }
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

Parse front matter from a string or buffer.

**Parameters:**

- `input` - String, Buffer, or object with `content` property
- `options` - Optional configuration

**Returns:** `GrayMatterFile` object with:

- `data` - Parsed front matter data
- `content` - Content after front matter
- `excerpt` - Extracted excerpt (if enabled)
- `orig` - Original input as Buffer
- `language` - Detected/specified language
- `matter` - Raw front matter string
- `isEmpty` - True if front matter block was empty
- `stringify(data?, options?)` - Stringify the file back

### `matter.stringify(file, data?, options?)`

Stringify data to front matter and append content.

### `matter.read(filepath, options?)`

Synchronously read and parse a file.

### `matter.test(str, options?)`

Test if a string has front matter.

### `matter.language(str, options?)`

Detect the language specified after the opening delimiter.

### Options

- `language` - Language to use for parsing (default: `'yaml'`)
- `delimiters` - Custom delimiters (default: `'---'`)
- `excerpt` - Enable excerpt extraction (`true`, string delimiter, or function)
- `excerpt_separator` - Custom excerpt separator
- `engines` - Custom parsing/stringifying engines

## Differences from gray-matter

- ESM-only (no CommonJS support)
- Uses [`@std/yaml`](https://jsr.io/@std/yaml) instead of `js-yaml`
- Removed JavaScript front matter engine (security: avoids `eval`)
- Removed deprecated options (`lang`, `delims`, `parsers`)
- Removed `section-matter` support
- TypeScript-first with strict types

## License

MIT
