import { defaults } from "./defaults.ts";
import { getEngine, toBuiltinLanguage } from "./engines.ts";
import type { GrayMatterFile, GrayMatterOptions } from "./types.ts";
import { isObject, isString } from "./utils.ts";

/**
 * Type guard for GrayMatterFile
 */
function isGrayMatterFile(val: unknown): val is GrayMatterFile {
  return isObject(val) && "content" in val && "data" in val;
}

/**
 * Ensure string ends with newline
 */
function newline(str: string): string {
  return str.slice(-1) !== "\n" ? str + "\n" : str;
}

/**
 * Stringify file object to string with front matter
 */
export function stringify(
  file: GrayMatterFile | string,
  data?: Record<string, unknown> | null,
  options?: GrayMatterOptions,
): string {
  if (data == null && options == null) {
    if (isGrayMatterFile(file)) {
      data = file.data;
      options = {};
    } else if (isString(file)) {
      return file;
    } else {
      throw new TypeError("expected file to be a string or object");
    }
  }

  if (!isGrayMatterFile(file)) {
    throw new TypeError("expected file to be a string or object");
  }

  const str = file.content;
  const opts = defaults(options);

  if (data == null) {
    if (!opts.data) return str;
    data = opts.data;
  }

  const language = toBuiltinLanguage(file.language || opts.language);
  const engine = getEngine(language);

  data = { ...file.data, ...data };
  const open = opts.delimiters[0];
  const close = opts.delimiters[1];
  const matter = engine.stringify!(data).trim();
  let buf = "";

  if (matter !== "{}") {
    buf = newline(open) + newline(matter) + newline(close);
  }

  if (isString(file.excerpt) && file.excerpt !== "") {
    if (str.indexOf(file.excerpt.trim()) === -1) {
      buf += newline(file.excerpt) + newline(close);
    }
  }

  return buf + newline(str);
}

if (import.meta.vitest) {
  const { fc, test } = await import("@fast-check/vitest");

  describe("stringify", () => {
    it("should stringify file object with data", () => {
      const file = {
        content: "hello world",
        data: { title: "Test" },
        excerpt: "",
        orig: new Uint8Array(),
        language: "yaml",
        matter: "",
        isEmpty: false,
        stringify: () => "",
      };
      const result = stringify(file);
      expect(result).toContain("---");
      expect(result).toContain("title: Test");
      expect(result).toContain("hello world");
    });

    it("should return string as-is when only string provided", () => {
      expect(stringify("hello")).toBe("hello");
    });

    it("should throw for invalid input", () => {
      expect(() => stringify(123 as unknown as string)).toThrow(TypeError);
    });

    it("should throw when file is not GrayMatterFile with data/options", () => {
      expect(() => stringify("not a file" as unknown as GrayMatterFile, { key: "value" })).toThrow(
        TypeError,
      );
    });

    it("should use opts.data when data is null", () => {
      const file = {
        content: "content",
        data: {},
        excerpt: "",
        orig: new Uint8Array(),
        language: "yaml",
        matter: "",
        isEmpty: false,
        stringify: () => "",
      };
      const result = stringify(file, null, { data: { fromOpts: true } });
      expect(result).toContain("fromOpts: true");
    });

    it("should return content only when data is null and opts.data is falsy", () => {
      const file = {
        content: "just content",
        data: {},
        excerpt: "",
        orig: new Uint8Array(),
        language: "yaml",
        matter: "",
        isEmpty: false,
        stringify: () => "",
      };
      const result = stringify(file, null, {});
      expect(result).toBe("just content");
    });

    it("should ensure trailing newline", () => {
      const file = {
        content: "no newline",
        data: { key: "value" },
        excerpt: "",
        orig: new Uint8Array(),
        language: "yaml",
        matter: "",
        isEmpty: false,
        stringify: () => "",
      };
      const result = stringify(file);
      expect(result.endsWith("\n")).toBe(true);
    });

    it("should not add front matter for empty data", () => {
      const file = {
        content: "content only",
        data: {},
        excerpt: "",
        orig: new Uint8Array(),
        language: "yaml",
        matter: "",
        isEmpty: false,
        stringify: () => "",
      };
      const result = stringify(file, {});
      expect(result).toBe("content only\n");
    });

    it("should include excerpt when present and not in content", () => {
      const file = {
        content: "main content",
        data: { title: "Test" },
        excerpt: "This is excerpt",
        orig: new Uint8Array(),
        language: "yaml",
        matter: "",
        isEmpty: false,
        stringify: () => "",
      };
      const result = stringify(file);
      expect(result).toContain("This is excerpt");
    });

    test.prop([
      fc.record({
        title: fc.string({ minLength: 1, maxLength: 50 }),
        count: fc.integer({ min: 0, max: 1000 }),
        enabled: fc.boolean(),
      }),
    ])("should always produce string ending with newline for any data", (data) => {
      const file = {
        content: "test content",
        data,
        excerpt: "",
        orig: new Uint8Array(),
        language: "yaml",
        matter: "",
        isEmpty: false,
        stringify: () => "",
      };
      const result = stringify(file);
      expect(result.endsWith("\n")).toBe(true);
    });

    test.prop([fc.string({ minLength: 0, maxLength: 100 })])(
      "should handle any content string",
      (content) => {
        const file = {
          content,
          data: { key: "value" },
          excerpt: "",
          orig: new Uint8Array(),
          language: "yaml",
          matter: "",
          isEmpty: false,
          stringify: () => "",
        };
        const result = stringify(file);
        expect(result).toBeTypeOf("string");
        expect(result.endsWith("\n")).toBe(true);
      },
    );
  });
}
