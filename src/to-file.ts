import type { GrayMatterFile, GrayMatterInput } from "./types.ts";
import { define, isObject, toBuffer, toString } from "./utils.ts";
import { stringify } from "./stringify.ts";

/**
 * Normalize the given value to ensure an object is returned
 * with the expected properties.
 */
export function toFile(input: GrayMatterInput): GrayMatterFile {
  let file: Partial<GrayMatterFile> & { content?: string };

  if (!isObject(input)) {
    file = { content: input as string };
  } else {
    file = input as Partial<GrayMatterFile>;
  }

  if (!isObject(file.data)) {
    file.data = {};
  }

  // set non-enumerable properties on the file object
  define(file, "orig", toBuffer(file.content ?? ""));
  define(file, "language", file.language ?? "");
  define(file, "matter", file.matter ?? "");
  define(
    file,
    "stringify",
    function (
      this: GrayMatterFile,
      data?: Record<string, unknown>,
      options?: { language?: string },
    ) {
      if (options?.language) {
        this.language = options.language;
      }
      return stringify(this, data, options);
    },
  );

  // strip BOM and ensure that "file.content" is a string
  file.content = toString(file.content ?? "");
  file.isEmpty = false;
  file.excerpt = "";

  return file as GrayMatterFile;
}
