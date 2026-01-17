import { defaults } from "./defaults.ts";
import { getEngine } from "./engine.ts";
import type { GrayMatterFile, GrayMatterOptions } from "./types.ts";
import { isObject } from "./utils.ts";

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
    if (isObject(file)) {
      data = (file as GrayMatterFile).data;
      options = {};
    } else if (typeof file === "string") {
      return file;
    } else {
      throw new TypeError("expected file to be a string or object");
    }
  }

  const fileObj = file as GrayMatterFile;
  const str = fileObj.content;
  const opts = defaults(options);

  if (data == null) {
    if (!opts.data) return str;
    data = opts.data;
  }

  const language = fileObj.language || opts.language;
  const engine = getEngine(language, opts);

  if (typeof engine.stringify !== "function") {
    throw new TypeError(`expected "${language}.stringify" to be a function`);
  }

  data = { ...fileObj.data, ...data };
  const open = opts.delimiters[0];
  const close = opts.delimiters[1];
  const matter = engine.stringify(data, options).trim();
  let buf = "";

  if (matter !== "{}") {
    buf = newline(open) + newline(matter) + newline(close);
  }

  if (typeof fileObj.excerpt === "string" && fileObj.excerpt !== "") {
    if (str.indexOf(fileObj.excerpt.trim()) === -1) {
      buf += newline(fileObj.excerpt) + newline(close);
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
        orig: Buffer.from(""),
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

    it("should ensure trailing newline", () => {
      const file = {
        content: "no newline",
        data: { key: "value" },
        excerpt: "",
        orig: Buffer.from(""),
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
        orig: Buffer.from(""),
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
        orig: Buffer.from(""),
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
        orig: Buffer.from(""),
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
          orig: Buffer.from(""),
          language: "yaml",
          matter: "",
          isEmpty: false,
          stringify: () => "",
        };
        const result = stringify(file);
        expect(typeof result).toBe("string");
        expect(result.endsWith("\n")).toBe(true);
      },
    );
  });
}
