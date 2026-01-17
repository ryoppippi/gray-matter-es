import { readFileSync } from "node:fs";
import { Buffer } from "node:buffer";
import { defaults } from "./defaults.ts";
import { engines } from "./engines.ts";
import { excerpt } from "./excerpt.ts";
import { parse } from "./parse.ts";
import { stringify } from "./stringify.ts";
import { toFile } from "./to-file.ts";
import { startsWith } from "./utils.ts";
import type {
  GrayMatterFile,
  GrayMatterInput,
  GrayMatterOptions,
  MatterFunction,
} from "./types.ts";

export type {
  Engine,
  Engines,
  GrayMatterFile,
  GrayMatterInput,
  GrayMatterOptions,
  MatterFunction,
  ResolvedOptions,
} from "./types.ts";

/**
 * Cache for parsed results
 */
const cache: Record<string, GrayMatterFile> = {};

/**
 * Takes a string or object with `content` property, extracts
 * and parses front-matter from the string, then returns an object
 * with `data`, `content` and other useful properties.
 *
 * @example
 * ```ts
 * import matter from 'grray-matter-es';
 * console.log(matter('---\ntitle: Home\n---\nOther stuff'));
 * //=> { data: { title: 'Home'}, content: 'Other stuff' }
 * ```
 */
function matterImpl(input: GrayMatterInput, options?: GrayMatterOptions): GrayMatterFile {
  if (input === "") {
    return {
      data: {},
      content: input,
      excerpt: "",
      orig: Buffer.from(input),
      language: "",
      matter: "",
      isEmpty: true,
      stringify: (data, opts) =>
        stringify(
          {
            data: {},
            content: "",
            excerpt: "",
            orig: Buffer.from(""),
            language: "",
            matter: "",
            isEmpty: true,
            stringify: () => "",
          },
          data,
          opts,
        ),
    };
  }

  let file = toFile(input);
  const cached = cache[file.content];

  if (!options) {
    if (cached) {
      file = { ...cached };
      file.orig = cached.orig;
      return file;
    }

    // only cache if there are no options passed
    cache[file.content] = file;
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
  if (!startsWith(str, open, openLen)) {
    excerpt(file, opts);
    return file;
  }

  // if the next character after the opening delimiter is
  // a character from the delimiter, then it's not a front-
  // matter delimiter
  if (str.charAt(openLen) === open.slice(-1)) {
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
    file.data = parse(file.language, file.matter, opts);
  }

  // update file.content
  if (closeIndex === len) {
    file.content = "";
  } else {
    file.content = str.slice(closeIndex + close.length);
    if (file.content[0] === "\r") {
      file.content = file.content.slice(1);
    }
    if (file.content[0] === "\n") {
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
  return startsWith(str, defaults(options).delimiters[0]);
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
   * Expose engines
   */
  engines,

  /**
   * Clear the cache
   */
  clearCache: (): void => {
    for (const key of Object.keys(cache)) {
      delete cache[key];
    }
  },

  /**
   * Expose cache (read-only access)
   */
  cache,
});

export default matter;

if (import.meta.vitest) {
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
}
