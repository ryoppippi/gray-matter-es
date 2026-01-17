import type { GrayMatterFile, GrayMatterInput, GrayMatterOptions } from "./types.ts";
import { getStringProp, isObject, toUint8Array, toString } from "./utils.ts";
import { stringify } from "./stringify.ts";

/**
 * Internal input shape after normalization
 */
interface NormalizedInput {
  content: string | Uint8Array;
  data?: unknown;
  language?: string;
  matter?: string;
}

/**
 * Normalize input to a consistent shape
 */
function normalizeInput(input: GrayMatterInput): NormalizedInput {
  if (isObject(input)) {
    return {
      content: getStringProp(input, "content"),
      data: input.data,
      language: getStringProp(input, "language"),
      matter: getStringProp(input, "matter"),
    };
  }
  // string or Uint8Array
  return { content: input };
}

/**
 * Normalize the given value to ensure an object is returned
 * with the expected properties.
 */
export function toFile(input: GrayMatterInput): GrayMatterFile {
  const normalized = normalizeInput(input);
  const data = isObject(normalized.data) ? normalized.data : {};
  const content = toString(normalized.content ?? "");
  const language = normalized.language ?? "";
  const matter = normalized.matter ?? "";
  const orig = toUint8Array(normalized.content ?? "");

  const file: GrayMatterFile = {
    data,
    content,
    excerpt: "",
    orig,
    language,
    matter,
    isEmpty: false,
    stringify(
      this: GrayMatterFile,
      newData?: Record<string, unknown>,
      options?: GrayMatterOptions,
    ) {
      if (options?.language) {
        this.language = options.language;
      }
      return stringify(this, newData, options);
    },
  };

  return file;
}

if (import.meta.vitest) {
  const { fc, test } = await import("@fast-check/vitest");

  describe("toFile", () => {
    it("should convert string to file object", () => {
      const result = toFile("hello world");
      expect(result.content).toBe("hello world");
      expect(result.data).toEqual({});
      expect(result.isEmpty).toBe(false);
      expect(result.excerpt).toBe("");
      expect(result.language).toBe("");
      expect(result.matter).toBe("");
    });

    it("should convert Uint8Array to file object", () => {
      const result = toFile(new TextEncoder().encode("buffer content"));
      expect(result.content).toBe("buffer content");
      expect(result.data).toEqual({});
    });

    it("should handle object with content property", () => {
      const result = toFile({ content: "object content", data: { key: "value" } });
      expect(result.content).toBe("object content");
      expect(result.data).toEqual({ key: "value" });
    });

    it("should preserve orig as Uint8Array", () => {
      const result = toFile("test");
      expect(result.orig).toBeInstanceOf(Uint8Array);
      expect(new TextDecoder().decode(result.orig)).toBe("test");
    });

    it("should set stringify as a function", () => {
      const result = toFile("content");
      expect(result.stringify).toBeTypeOf("function");
    });

    it("should initialize data to empty object if not provided", () => {
      const result = toFile({ content: "test" });
      expect(result.data).toEqual({});
    });

    it("should strip BOM from content", () => {
      const bomString = "\uFEFFhello";
      const result = toFile(bomString);
      expect(result.content).toBe("hello");
    });

    it("should preserve existing language", () => {
      const result = toFile({ content: "test", language: "json" } as GrayMatterInput);
      expect(result.language).toBe("json");
    });

    it("should preserve existing matter", () => {
      const result = toFile({ content: "test", matter: "raw matter" } as GrayMatterInput);
      expect(result.matter).toBe("raw matter");
    });

    test.prop([fc.string({ minLength: 0, maxLength: 200 })])(
      "should always return valid file object for any string",
      (input) => {
        const result = toFile(input);
        expect(result.content).toBeTypeOf("string");
        expect(result.data).toBeTypeOf("object");
        expect(result.data).not.toBeNull();
        expect(result.isEmpty).toBeTypeOf("boolean");
        expect(result.excerpt).toBeTypeOf("string");
        expect(result.language).toBeTypeOf("string");
        expect(result.matter).toBeTypeOf("string");
        expect(result.orig).toBeInstanceOf(Uint8Array);
        expect(result.stringify).toBeTypeOf("function");
      },
    );

    test.prop([fc.uint8Array({ minLength: 0, maxLength: 200 })])(
      "should handle any Uint8Array input",
      (arr) => {
        const result = toFile(arr);
        expect(result.content).toBeTypeOf("string");
        expect(result.orig).toBeInstanceOf(Uint8Array);
      },
    );

    test.prop([
      fc.record({
        content: fc.string({ minLength: 0, maxLength: 100 }),
        data: fc.option(fc.dictionary(fc.string(), fc.string(), { maxKeys: 5 }), {
          nil: undefined,
        }),
      }),
    ])("should handle object input with optional data", ({ content, data }) => {
      const input = data !== undefined ? { content, data } : { content };
      const result = toFile(input);
      expect(result.content).toBe(content);
      expect(result.data).toBeTypeOf("object");
      if (data !== undefined) {
        expect(result.data).toEqual(data);
      }
    });

    test.prop([fc.string({ minLength: 1, maxLength: 50 })])(
      "should strip BOM consistently",
      (str) => {
        const withBom = "\uFEFF" + str;
        const result = toFile(withBom);
        expect(result.content).toBe(str);
        expect(result.content.charCodeAt(0)).not.toBe(0xfeff);
      },
    );
  });
}
