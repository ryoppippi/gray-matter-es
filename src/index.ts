import { readFileSync } from "node:fs";
import { defaults } from "./defaults.ts";
import { toBuiltinLanguage } from "./engines.ts";
import { excerpt } from "./excerpt.ts";
import { parse } from "./parse.ts";
import { stringify } from "./stringify.ts";
import { toFile } from "./to-file.ts";
import type {
  GrayMatterFile,
  GrayMatterInput,
  GrayMatterOptions,
  MatterFunction,
} from "./types.ts";

export type {
  Engine,
  GrayMatterFile,
  GrayMatterInput,
  GrayMatterOptions,
  MatterFunction,
  ResolvedOptions,
} from "./types.ts";

export type { BuiltinLanguage } from "./engines.ts";

/**
 * Cache for parsed results
 */
const cache = new Map<string, GrayMatterFile>();

/**
 * Takes a string or object with `content` property, extracts
 * and parses front-matter from the string, then returns an object
 * with `data`, `content` and other useful properties.
 *
 * @example
 * ```ts
 * import matter from 'gray-matter-es';
 * console.log(matter('---\ntitle: Home\n---\nOther stuff'));
 * //=> { data: { title: 'Home'}, content: 'Other stuff' }
 * ```
 */
function matterImpl(input: GrayMatterInput, options?: GrayMatterOptions): GrayMatterFile {
  if (input === "") {
    return { ...toFile(input), isEmpty: true };
  }

  let file = toFile(input);
  const cached = cache.get(file.content);

  if (!options) {
    if (cached) {
      file = { ...cached };
      file.orig = cached.orig;
      return file;
    }

    // only cache if there are no options passed
    cache.set(file.content, file);
  }

  return parseMatter(file, options);
}

/**
 * Parse front matter from file
 */
function parseMatter(file: GrayMatterFile, options?: GrayMatterOptions): GrayMatterFile {
  const opts = defaults(options);
  const open = opts.delimiters[0];
  const close = "\n" + opts.delimiters[1];
  let str = file.content;

  if (opts.language) {
    file.language = opts.language;
  }

  // get the length of the opening delimiter
  const openLen = open.length;
  if (!str.startsWith(open)) {
    excerpt(file, opts);
    return file;
  }

  // if the next character after the opening delimiter is
  // a character from the delimiter, then it's not a front-
  // matter delimiter
  if (str.at(openLen) === open.at(-1)) {
    return file;
  }

  // strip the opening delimiter
  str = str.slice(openLen);
  const len = str.length;

  // use the language defined after first delimiter, if it exists
  const lang = matterLanguage(str, opts);
  if (lang.name) {
    file.language = lang.name;
    str = str.slice(lang.raw.length);
  }

  // get the index of the closing delimiter
  let closeIndex = str.indexOf(close);
  if (closeIndex === -1) {
    closeIndex = len;
  }

  // get the raw front-matter block
  file.matter = str.slice(0, closeIndex);

  const block = file.matter.replace(/^\s*#[^\n]+/gm, "").trim();
  if (block === "") {
    file.isEmpty = true;
    file.empty = file.content;
    file.data = {};
  } else {
    // create file.data by parsing the raw file.matter block
    file.data = parse(toBuiltinLanguage(file.language), file.matter);
  }

  // update file.content
  if (closeIndex === len) {
    file.content = "";
  } else {
    file.content = str.slice(closeIndex + close.length);
    if (file.content.at(0) === "\r") {
      file.content = file.content.slice(1);
    }
    if (file.content.at(0) === "\n") {
      file.content = file.content.slice(1);
    }
  }

  excerpt(file, opts);
  return file;
}

/**
 * Detect the language to use, if one is defined after the
 * first front-matter delimiter.
 */
function matterLanguage(str: string, options?: GrayMatterOptions): { raw: string; name: string } {
  const opts = defaults(options);
  const open = opts.delimiters[0];

  if (matterTest(str, opts)) {
    str = str.slice(open.length);
  }

  const language = str.slice(0, str.search(/\r?\n/));
  return {
    raw: language,
    name: language ? language.trim() : "",
  };
}

/**
 * Returns true if the given string has front matter.
 */
function matterTest(str: string, options?: GrayMatterOptions): boolean {
  return str.startsWith(defaults(options).delimiters[0]);
}

/**
 * The matter function with all static methods
 */
const matter: MatterFunction = Object.assign(matterImpl, {
  /**
   * Stringify an object to YAML or the specified language, and
   * append it to the given string.
   */
  stringify: (
    file: GrayMatterFile | string,
    data?: Record<string, unknown>,
    options?: GrayMatterOptions,
  ): string => {
    if (typeof file === "string") file = matterImpl(file, options);
    return stringify(file, data, options);
  },

  /**
   * Synchronously read a file from the file system and parse front matter.
   */
  read: (filepath: string, options?: GrayMatterOptions): GrayMatterFile => {
    const str = readFileSync(filepath, "utf8");
    const file = matterImpl(str, options);
    file.path = filepath;
    return file;
  },

  /**
   * Returns true if the given string has front matter.
   */
  test: matterTest,

  /**
   * Detect the language to use, if one is defined after the
   * first front-matter delimiter.
   */
  language: matterLanguage,

  /**
   * Clear the cache
   */
  clearCache: (): void => {
    cache.clear();
  },

  /**
   * Expose cache (read-only access)
   */
  cache,
});

export default matter;

if (import.meta.vitest) {
  const { fc, test } = await import("@fast-check/vitest");
  const { Buffer } = await import("node:buffer");

  describe("matter", () => {
    beforeEach(() => {
      matter.clearCache();
    });

    it("should extract YAML front matter", () => {
      const actual = matter("---\nabc: xyz\n---");
      expect(actual.data).toEqual({ abc: "xyz" });
      expect(actual.content).toBe("");
    });

    it("should extract YAML front matter with content", () => {
      const actual = matter("---\nabc: xyz\n---\nfoo");
      expect(actual.data).toEqual({ abc: "xyz" });
      expect(actual.content).toBe("foo");
    });

    it("should return empty object for empty string", () => {
      const actual = matter("");
      expect(actual.data).toEqual({});
      expect(actual.content).toBe("");
    });

    it("should return content when no front matter", () => {
      const actual = matter("foo bar");
      expect(actual.data).toEqual({});
      expect(actual.content).toBe("foo bar");
    });

    it("should handle CRLF line endings", () => {
      const actual = matter("---\r\nabc: xyz\r\n---\r\ncontent");
      expect(actual.data).toEqual({ abc: "xyz" });
      expect(actual.content).toBe("content");
    });

    it("should detect language after delimiter", () => {
      const actual = matter('---json\n{"abc": "xyz"}\n---\ncontent');
      expect(actual.data).toEqual({ abc: "xyz" });
      expect(actual.language).toBe("json");
    });

    it("should handle custom delimiters", () => {
      const actual = matter("~~~\nabc: xyz\n~~~\ncontent", {
        delimiters: "~~~",
      });
      expect(actual.data).toEqual({ abc: "xyz" });
    });

    it("should extract excerpt when enabled", () => {
      const actual = matter("---\nabc: xyz\n---\nexcerpt\n---\ncontent", {
        excerpt: true,
      });
      expect(actual.excerpt).toBe("excerpt\n");
    });

    it("should use custom excerpt separator", () => {
      const actual = matter("---\nabc: xyz\n---\nexcerpt\n<!-- more -->\ncontent", {
        excerpt: true,
        excerpt_separator: "<!-- more -->",
      });
      expect(actual.excerpt).toBe("excerpt\n");
    });

    it("should cache results when no options", () => {
      const input = "---\nabc: xyz\n---";
      const first = matter(input);
      const second = matter(input);
      expect(first.data).toEqual(second.data);
    });

    it("should not cache when options provided", () => {
      const input = "---\nabc: xyz\n---";
      matter(input);
      const second = matter(input, { language: "yaml" });
      expect(second.data).toEqual({ abc: "xyz" });
    });
  });

  describe("matter.stringify", () => {
    it("should stringify data to YAML front matter", () => {
      const result = matter.stringify("content", { title: "Hello" });
      expect(result).toContain("---");
      expect(result).toContain("title: Hello");
      expect(result).toContain("content");
    });

    it("should stringify file object", () => {
      const file = matter("---\ntitle: Test\n---\ncontent");
      const result = matter.stringify(file, { title: "Updated" });
      expect(result).toContain("title: Updated");
    });
  });

  describe("matter.test", () => {
    it("should return true for string with front matter", () => {
      expect(matter.test("---\nabc: xyz\n---")).toBe(true);
    });

    it("should return false for string without front matter", () => {
      expect(matter.test("foo bar")).toBe(false);
    });
  });

  describe("matter.language", () => {
    it("should detect language after delimiter", () => {
      const result = matter.language("---json\n{}\n---");
      expect(result.name).toBe("json");
    });

    it("should return empty for no language", () => {
      const result = matter.language("---\nabc: xyz\n---");
      expect(result.name).toBe("");
    });
  });

  describe("property-based tests", () => {
    beforeEach(() => {
      matter.clearCache();
    });

    /** Arbitrary for YAML-safe keys */
    const yamlKey = fc
      .string({ minLength: 1, maxLength: 20 })
      .filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s));

    /** Arbitrary for YAML-safe values */
    const yamlSafeValue = fc.oneof(
      fc.string({ maxLength: 50 }),
      fc.integer({ min: -10000, max: 10000 }),
      fc.boolean(),
    );

    /** Arbitrary for simple YAML-compatible objects */
    const yamlSafeObject = fc.dictionary(yamlKey, yamlSafeValue, { minKeys: 1, maxKeys: 5 });

    test.prop([fc.string({ minLength: 1, maxLength: 100 })])(
      "Buffer and string input should produce equivalent results",
      (content) => {
        matter.clearCache();
        const fromString = matter(content);
        matter.clearCache();
        const fromBuffer = matter(Buffer.from(content));

        expect(fromString.content).toBe(fromBuffer.content);
        expect(fromString.data).toEqual(fromBuffer.data);
        expect(fromString.excerpt).toBe(fromBuffer.excerpt);
      },
    );

    test.prop([yamlSafeObject, fc.string({ minLength: 0, maxLength: 50 })])(
      "parse then stringify should preserve data",
      (data, content) => {
        const frontMatter = Object.entries(data)
          .map(([k, v]) => `${k}: ${typeof v === "string" ? JSON.stringify(v) : v}`)
          .join("\n");
        const input = `---\n${frontMatter}\n---\n${content}`;

        matter.clearCache();
        const parsed = matter(input);
        const stringified = matter.stringify(parsed);
        matter.clearCache();
        const reparsed = matter(stringified);

        expect(reparsed.data).toEqual(parsed.data);
      },
    );

    test.prop([fc.string({ minLength: 0, maxLength: 100 })])(
      "content without front matter should be preserved",
      (content) => {
        const safeContent = content.replace(/^---/gm, "___");
        matter.clearCache();
        const result = matter(safeContent);

        expect(result.content).toBe(safeContent);
        expect(result.data).toEqual({});
      },
    );

    test.prop([
      yamlSafeObject,
      fc.string({ minLength: 0, maxLength: 50 }),
      fc.string({ minLength: 1, maxLength: 50 }),
    ])("matter.test should correctly detect front matter", (data, content, noFrontMatter) => {
      const frontMatter = Object.entries(data)
        .map(([k, v]) => `${k}: ${typeof v === "string" ? JSON.stringify(v) : v}`)
        .join("\n");
      const withFrontMatter = `---\n${frontMatter}\n---\n${content}`;
      const withoutFrontMatter = noFrontMatter.replace(/^---/gm, "___");

      expect(matter.test(withFrontMatter)).toBe(true);
      expect(matter.test(withoutFrontMatter)).toBe(withoutFrontMatter.startsWith("---"));
    });

    test.prop([fc.constantFrom("yaml", "json"), yamlSafeObject, fc.string({ maxLength: 30 })])(
      "should handle different languages",
      (language, data, content) => {
        let frontMatterContent: string;
        if (language === "json") {
          frontMatterContent = JSON.stringify(data);
        } else {
          frontMatterContent = Object.entries(data)
            .map(([k, v]) => `${k}: ${typeof v === "string" ? JSON.stringify(v) : v}`)
            .join("\n");
        }

        const input = `---${language}\n${frontMatterContent}\n---\n${content}`;
        matter.clearCache();
        const result = matter(input);

        expect(result.language).toBe(language);
        expect(result.data).toEqual(data);
      },
    );

    test.prop([fc.constantFrom("---", "~~~", "***", "+++")])(
      "should handle custom delimiters",
      (delimiter) => {
        const input = `${delimiter}\ntitle: Test\n${delimiter}\ncontent`;
        matter.clearCache();
        const result = matter(input, { delimiters: delimiter });

        expect(result.data).toEqual({ title: "Test" });
        expect(result.content).toBe("content");
      },
    );

    test.prop([
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.string({ minLength: 1, maxLength: 20 }),
    ])("should extract excerpt with custom separator", (excerptText, contentText) => {
      const separator = "<!-- more -->";
      const safeExcerpt = excerptText.replace(separator, "");
      const safeContent = contentText.replace(separator, "");
      const input = `---\ntitle: Test\n---\n${safeExcerpt}\n${separator}\n${safeContent}`;

      matter.clearCache();
      const result = matter(input, { excerpt: true, excerpt_separator: separator });

      expect(result.excerpt).toBe(`${safeExcerpt}\n`);
    });

    test.prop([fc.string({ minLength: 0, maxLength: 50 })])(
      "should handle CRLF and LF consistently",
      (content) => {
        const yamlData = "title: Test";
        const inputLF = `---\n${yamlData}\n---\n${content}`;
        const inputCRLF = `---\r\n${yamlData}\r\n---\r\n${content}`;

        matter.clearCache();
        const resultLF = matter(inputLF);
        matter.clearCache();
        const resultCRLF = matter(inputCRLF);

        expect(resultLF.data).toEqual(resultCRLF.data);
        expect(resultLF.content).toBe(resultCRLF.content);
      },
    );
  });
}
