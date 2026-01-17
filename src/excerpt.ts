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
