import { engines } from "./engines.ts";
import type { GrayMatterOptions, ResolvedOptions } from "./types.ts";
import { arrayify } from "./utils.ts";

/**
 * Apply default options
 */
export function defaults(options?: GrayMatterOptions): ResolvedOptions {
  const opts = { ...options } as ResolvedOptions;

  // ensure that delimiters are an array
  const delims = arrayify(opts.delimiters ?? "---");
  opts.delimiters = delims.length === 1 ? [delims[0]!, delims[0]!] : [delims[0]!, delims[1]!];

  opts.language = (opts.language ?? "yaml").toLowerCase();
  opts.engines = { ...engines, ...opts.engines };

  return opts;
}
