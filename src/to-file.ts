import type { GrayMatterFile, GrayMatterInput, GrayMatterOptions } from "./types.ts";
import { getStringProp, isObject, toBuffer, toString } from "./utils.ts";
import { stringify } from "./stringify.ts";

/**
 * Internal input shape after normalization
 */
interface NormalizedInput {
  content: string | Buffer;
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
  // string or Buffer
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
  const orig = toBuffer(normalized.content ?? "");

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
  const { Buffer } = await import("node:buffer");

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

    it("should convert Buffer to file object", () => {
      const result = toFile(Buffer.from("buffer content"));
      expect(result.content).toBe("buffer content");
      expect(result.data).toEqual({});
    });

    it("should handle object with content property", () => {
      const result = toFile({ content: "object content", data: { key: "value" } });
      expect(result.content).toBe("object content");
      expect(result.data).toEqual({ key: "value" });
    });

    it("should preserve orig as Buffer", () => {
      const result = toFile("test");
      expect(Buffer.isBuffer(result.orig)).toBe(true);
      expect(result.orig.toString()).toBe("test");
    });

    it("should set stringify as a function", () => {
      const result = toFile("content");
      expect(typeof result.stringify).toBe("function");
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
        expect(typeof result.content).toBe("string");
        expect(typeof result.data).toBe("object");
        expect(result.data).not.toBeNull();
        expect(typeof result.isEmpty).toBe("boolean");
        expect(typeof result.excerpt).toBe("string");
        expect(typeof result.language).toBe("string");
        expect(typeof result.matter).toBe("string");
        expect(Buffer.isBuffer(result.orig)).toBe(true);
        expect(typeof result.stringify).toBe("function");
      },
    );

    test.prop([fc.uint8Array({ minLength: 0, maxLength: 200 })])(
      "should handle any Buffer input",
      (arr) => {
        const buffer = Buffer.from(arr);
        const result = toFile(buffer);
        expect(typeof result.content).toBe("string");
        expect(Buffer.isBuffer(result.orig)).toBe(true);
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
      expect(typeof result.data).toBe("object");
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
