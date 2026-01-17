import { parse as yamlParse, stringify as yamlStringify } from "@std/yaml";
import type { Engine, GrayMatterOptions } from "./types.ts";
import { isString, toRecord } from "./utils.ts";

/**
 * Built-in language names
 */
export type BuiltinLanguage = "yaml" | "json";

/**
 * Array of built-in language names for runtime validation
 */
const BUILTIN_LANGUAGES = ["yaml", "json"] as const satisfies readonly BuiltinLanguage[];

/**
 * Check if value is a built-in language name
 */
function isBuiltinLanguage(value: unknown): value is BuiltinLanguage {
  return isString(value) && BUILTIN_LANGUAGES.includes(value as BuiltinLanguage);
}

/**
 * Assert that value is a built-in language, returning the default if not
 */
export function toBuiltinLanguage(
  value: unknown,
  defaultLang: BuiltinLanguage = "yaml",
): BuiltinLanguage {
  return isBuiltinLanguage(value) ? value : defaultLang;
}

/**
 * YAML engine using @std/yaml
 */
const yaml = {
  parse: (str: string): Record<string, unknown> => {
    return toRecord(yamlParse(str));
  },
  stringify: (data: Record<string, unknown>): string => {
    return yamlStringify(data);
  },
} as const satisfies Engine;

/**
 * JSON engine
 */
const json = {
  parse: (str: string): Record<string, unknown> => {
    return toRecord(JSON.parse(str));
  },
  stringify: (
    data: Record<string, unknown>,
    options?: GrayMatterOptions & { replacer?: null; space?: number },
  ): string => {
    const opts = { replacer: null, space: 2, ...options };
    return JSON.stringify(data, opts.replacer, opts.space);
  },
} as const satisfies Engine;

/**
 * Get engine by language name
 */
export function getEngine(language: BuiltinLanguage): Engine {
  switch (language) {
    case "yaml":
      return yaml;
    case "json":
      return json;
    default:
      throw new Error(`Unknown language: ${language satisfies never}`);
  }
}

if (import.meta.vitest) {
  const { fc, test } = await import("@fast-check/vitest");

  /** Arbitrary for YAML-safe values (no undefined, functions, symbols) */
  const yamlSafeValue = fc.oneof(
    fc.string(),
    fc.integer(),
    fc.double({ noNaN: true, noDefaultInfinity: true }),
    fc.boolean(),
    fc.constant(null),
  );

  /** Arbitrary for simple YAML-compatible objects */
  const yamlSafeObject = fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
    yamlSafeValue,
    { minKeys: 1, maxKeys: 5 },
  );

  describe("yaml engine", () => {
    it("should parse simple YAML", () => {
      const result = yaml.parse("title: Hello\ncount: 42");
      expect(result).toEqual({ title: "Hello", count: 42 });
    });

    it("should return empty object for null YAML", () => {
      const result = yaml.parse("null");
      expect(result).toEqual({});
    });

    it("should stringify object to YAML", () => {
      const result = yaml.stringify({ title: "Test", count: 10 });
      expect(result).toContain("title: Test");
      expect(result).toContain("count: 10");
    });

    test.prop([yamlSafeObject])("should round-trip parse/stringify for safe objects", (data) => {
      const stringified = yaml.stringify(data);
      const parsed = yaml.parse(stringified);
      expect(parsed).toEqual(data);
    });

    test.prop([fc.string({ minLength: 1, maxLength: 100 }), fc.integer()])(
      "should preserve string and number types",
      (str, num) => {
        const data = { str, num };
        const stringified = yaml.stringify(data);
        const parsed = yaml.parse(stringified);
        expect(parsed.str).toBe(str);
        expect(parsed.num).toBe(num);
      },
    );
  });

  describe("json engine", () => {
    it("should parse JSON", () => {
      const result = json.parse('{"title": "Hello", "count": 42}');
      expect(result).toEqual({ title: "Hello", count: 42 });
    });

    it("should stringify object to JSON", () => {
      const result = json.stringify({ title: "Test" });
      expect(JSON.parse(result)).toEqual({ title: "Test" });
    });

    it("should throw on invalid JSON", () => {
      expect(() => json.parse("not json")).toThrow();
    });

    test.prop([
      fc.record({
        title: fc.string(),
        count: fc.integer(),
        active: fc.boolean(),
      }),
    ])("should round-trip parse/stringify", (data) => {
      const stringified = json.stringify(data);
      const parsed = json.parse(stringified);
      expect(parsed).toEqual(data);
    });

    test.prop([
      fc.oneof(
        fc.string(),
        fc.integer(),
        fc.boolean(),
        fc.constant(null),
        fc.array(fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))),
      ),
    ])("should handle common JSON values", (value) => {
      const wrapped = { value };
      const stringified = json.stringify(wrapped);
      const parsed = json.parse(stringified);
      expect(parsed).toEqual(wrapped);
    });
  });

  describe("getEngine", () => {
    it("should return yaml engine", () => {
      expect(getEngine("yaml")).toBe(yaml);
    });

    it("should return json engine", () => {
      expect(getEngine("json")).toBe(json);
    });
  });

  describe("isBuiltinLanguage", () => {
    it("should return true for yaml", () => {
      expect(isBuiltinLanguage("yaml")).toBe(true);
    });

    it("should return true for json", () => {
      expect(isBuiltinLanguage("json")).toBe(true);
    });

    it("should return false for unknown languages", () => {
      expect(isBuiltinLanguage("toml")).toBe(false);
      expect(isBuiltinLanguage("")).toBe(false);
    });

    it("should return false for non-strings", () => {
      expect(isBuiltinLanguage(null)).toBe(false);
      expect(isBuiltinLanguage(undefined)).toBe(false);
      expect(isBuiltinLanguage(123)).toBe(false);
    });
  });

  describe("toBuiltinLanguage", () => {
    it("should return valid language as-is", () => {
      expect(toBuiltinLanguage("yaml")).toBe("yaml");
      expect(toBuiltinLanguage("json")).toBe("json");
    });

    it("should return default for invalid language", () => {
      expect(toBuiltinLanguage("toml")).toBe("yaml");
      expect(toBuiltinLanguage("")).toBe("yaml");
    });

    it("should use custom default", () => {
      expect(toBuiltinLanguage("toml", "json")).toBe("json");
    });
  });
}
