import { defaults } from "./defaults.ts";
import type { GrayMatterFile, GrayMatterOptions } from "./types.ts";

/**
 * Extract excerpt from file content
 */
export function excerpt(file: GrayMatterFile, options?: GrayMatterOptions): GrayMatterFile {
  const opts = defaults(options);

  if (file.data == null) {
    file.data = {};
  }

  if (typeof opts.excerpt === "function") {
    opts.excerpt(file, opts);
    return file;
  }

  const sep =
    (file.data as { excerpt_separator?: string }).excerpt_separator ?? opts.excerpt_separator;

  if (sep == null && (opts.excerpt === false || opts.excerpt == null)) {
    return file;
  }

  const delimiter = typeof opts.excerpt === "string" ? opts.excerpt : (sep ?? opts.delimiters[0]);

  // if enabled, get the excerpt defined after front-matter
  const idx = file.content.indexOf(delimiter);
  if (idx !== -1) {
    file.excerpt = file.content.slice(0, idx);
  }

  return file;
}

if (import.meta.vitest) {
  const { fc, test } = await import("@fast-check/vitest");
  const { Buffer } = await import("node:buffer");

  const makeFile = (content: string, data: Record<string, unknown> = {}): GrayMatterFile => ({
    content,
    data,
    excerpt: "",
    orig: Buffer.from(content),
    language: "yaml",
    matter: "",
    isEmpty: false,
    stringify: () => "",
  });

  describe("excerpt", () => {
    it("should extract excerpt using default delimiter", () => {
      const file = makeFile("This is excerpt\n---\nThis is content");
      const result = excerpt(file, { excerpt: true });
      expect(result.excerpt).toBe("This is excerpt\n");
    });

    it("should extract excerpt using custom string delimiter", () => {
      const file = makeFile("This is excerpt\n<!-- more -->\nThis is content");
      const result = excerpt(file, { excerpt: "<!-- more -->" });
      expect(result.excerpt).toBe("This is excerpt\n");
    });

    it("should use excerpt_separator from options", () => {
      const file = makeFile("Excerpt here\n***\nContent here");
      const result = excerpt(file, { excerpt: true, excerpt_separator: "***" });
      expect(result.excerpt).toBe("Excerpt here\n");
    });

    it("should use excerpt_separator from file.data", () => {
      const file = makeFile("Excerpt\n<!-- end -->\nContent", {
        excerpt_separator: "<!-- end -->",
      });
      const result = excerpt(file, { excerpt: true });
      expect(result.excerpt).toBe("Excerpt\n");
    });

    it("should not extract when excerpt is false", () => {
      const file = makeFile("Some content\n---\nMore content");
      const result = excerpt(file, { excerpt: false });
      expect(result.excerpt).toBe("");
    });

    it("should not modify when delimiter not found", () => {
      const file = makeFile("No delimiter here");
      const result = excerpt(file, { excerpt: true });
      expect(result.excerpt).toBe("");
    });

    it("should call custom excerpt function", () => {
      const file = makeFile("Custom content");
      const customFn = vi.fn((f: GrayMatterFile) => {
        f.excerpt = "Custom excerpt";
      });
      const result = excerpt(file, { excerpt: customFn });
      expect(customFn).toHaveBeenCalledOnce();
      expect(result.excerpt).toBe("Custom excerpt");
    });

    it("should initialize file.data if null", () => {
      const file = makeFile("content");
      file.data = null as unknown as Record<string, unknown>;
      const result = excerpt(file, {});
      expect(result.data).toEqual({});
    });

    test.prop([
      fc.string({ minLength: 1, maxLength: 50 }),
      fc.string({ minLength: 1, maxLength: 50 }),
    ])("should extract correct excerpt when delimiter exists", (excerptText, contentText) => {
      const delimiter = "---";
      const content = `${excerptText}\n${delimiter}\n${contentText}`;
      const file = makeFile(content);
      const result = excerpt(file, { excerpt: true });

      expect(result.excerpt).toBe(`${excerptText}\n`);
    });

    test.prop([fc.string({ minLength: 1, maxLength: 100 })])(
      "should not extract when no delimiter in content",
      (content) => {
        const safeContent = content.replace(/---/g, "___");
        const file = makeFile(safeContent);
        const result = excerpt(file, { excerpt: true });
        expect(result.excerpt).toBe("");
      },
    );

    test.prop([
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.string({ minLength: 1, maxLength: 20 }),
      fc
        .string({ minLength: 1, maxLength: 10 })
        .filter((s) => !s.includes("\n") && !/[[\]{}()*+?.,\\^$|#]/.test(s)),
    ])("should work with any custom delimiter", (excerptText, contentText, customDelimiter) => {
      const safeExcerpt = excerptText.replaceAll(customDelimiter, "");
      if (safeExcerpt === "") return;
      const content = `${safeExcerpt}\n${customDelimiter}\n${contentText}`;
      const file = makeFile(content);
      const result = excerpt(file, { excerpt: customDelimiter });

      expect(result.excerpt).toBe(`${safeExcerpt}\n`);
    });
  });
}
