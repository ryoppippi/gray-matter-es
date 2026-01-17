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
