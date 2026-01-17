import { parse as yamlParse, stringify as yamlStringify } from "@std/yaml";
import type { Engine, Engines, GrayMatterOptions } from "./types.ts";

/**
 * YAML engine using @std/yaml
 */
const yaml = {
  parse: (str: string, _options?: GrayMatterOptions): Record<string, unknown> => {
    const result = yamlParse(str);
    return (result as Record<string, unknown>) ?? {};
  },
  stringify: (data: Record<string, unknown>, _options?: GrayMatterOptions): string => {
    return yamlStringify(data as Record<string, unknown>);
  },
} as const satisfies Engine;

/**
 * JSON engine
 */
const json = {
  parse: (str: string, _options?: GrayMatterOptions): Record<string, unknown> => {
    return JSON.parse(str) as Record<string, unknown>;
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
 * JavaScript engine (uses eval)
 */
const javascript = {
  parse: function parse(
    str: string,
    _options?: GrayMatterOptions,
    wrap: boolean = true,
  ): Record<string, unknown> {
    try {
      let code = str;
      if (wrap !== false) {
        code = "(function() {\nreturn " + str.trim() + ";\n}());";
      }
      // eslint-disable-next-line no-eval
      return (eval(code) as Record<string, unknown>) || {};
    } catch (err) {
      if (wrap !== false && err instanceof Error && /(unexpected|identifier)/i.test(err.message)) {
        return parse(str, _options, false);
      }
      throw new SyntaxError(String(err));
    }
  },
  stringify: (): never => {
    throw new Error("stringifying JavaScript is not supported");
  },
} as const satisfies Engine;

/**
 * Default engines
 */
export const engines = {
  yaml,
  json,
  javascript,
} as const satisfies Engines;

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

  describe("javascript engine", () => {
    it("should parse JavaScript object literal", () => {
      const result = javascript.parse("{ title: 'Hello', count: 42 }");
      expect(result).toEqual({ title: "Hello", count: 42 });
    });

    it("should handle object with expressions", () => {
      const result = javascript.parse("{ sum: 1 + 2, arr: [1, 2, 3] }");
      expect(result).toEqual({ sum: 3, arr: [1, 2, 3] });
    });

    it("should throw on invalid syntax", () => {
      expect(() => javascript.parse("{{{{")).toThrow(SyntaxError);
    });

    it("should throw when stringify is called", () => {
      expect(() => javascript.stringify()).toThrow("stringifying JavaScript is not supported");
    });

    it("should return empty object for falsy result", () => {
      const result = javascript.parse("null");
      expect(result).toEqual({});
    });

    test.prop([
      fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[a-zA-Z_]/.test(s)),
      fc.integer({ min: -1000, max: 1000 }),
    ])("should parse simple object literals", (key, value) => {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_");
      const code = `{ ${safeKey}: ${value} }`;
      const result = javascript.parse(code);
      expect(result[safeKey]).toBe(value);
    });
  });
}
