# TypeScript Patterns

## Minimize Use of `as` Type Assertions

Avoid using `as` for type assertions whenever possible. Prefer these alternatives:

### 1. Use validation functions for external data

When parsing external data (JSON, YAML, user input), use validation/coercion functions instead of `as`:

```typescript
// Good - validates and coerces to correct type
const data = toRecord(JSON.parse(str));
const lang = toBuiltinLanguage(input);

// Avoid - unsafe, no runtime validation
const data = JSON.parse(str) as Record<string, unknown>;
const lang = input as BuiltinLanguage;
```

### 2. Use type guards for narrowing

When narrowing union types, use type guard functions:

```typescript
// Good - type guard with runtime check
function isGrayMatterFile(val: unknown): val is GrayMatterFile {
  return isObject(val) && "content" in val && "data" in val;
}

if (isGrayMatterFile(file)) {
  // file is now typed as GrayMatterFile
  console.log(file.content);
}

// Avoid - assertion without validation
const fileObj = file as GrayMatterFile;
```

### 3. Use helper functions for property access

When accessing properties on unknown objects, use helper functions:

```typescript
// Good - safe property access with defaults
const language = getStringProp(input, "language");
const content = getStringProp(input, "content", "");

// Avoid - unsafe assertion
const language = (input as { language?: string }).language ?? "";
```

### 4. When `as` IS acceptable

- `as const satisfies` - for preserving literal types (see below)
- Test code - when intentionally testing edge cases with invalid types
- After exhaustive type guards - when TypeScript can't infer the narrowed type

## Use `as const satisfies` for Object/Function Definitions

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

## Use `== null` for Nullish Checks

Prefer `== null` over `=== undefined || === null` for checking both `undefined` and `null`:

```typescript
// Good - concise idiom that checks both undefined and null
if (data == null) {
  return defaultValue;
}

// Avoid - verbose and unnecessary
if (data === undefined || data === null) {
  return defaultValue;
}
```

## Prefer `??` over `||` for Default Values

Use nullish coalescing (`??`) instead of logical OR (`||`) when providing default values, unless you intentionally want to treat empty strings, `0`, or `false` as falsy:

```typescript
// Good - only falls back for null/undefined
const name = input ?? "default";
const count = options.count ?? 0;

// Avoid - empty string, 0, false are treated as falsy
const name = input || "default"; // "" becomes "default"
const count = options.count || 0; // 0 becomes 0 (works by accident)

// Exception: when you WANT to treat empty string as falsy
const language = file.language || opts.language; // "" should fall back
```
