import { defaults } from "./defaults.ts";
import { getEngine } from "./engine.ts";
import type { GrayMatterOptions } from "./types.ts";

/**
 * Parse front matter string using the specified language engine
 */
export function parse(
  language: string,
  str: string,
  options?: GrayMatterOptions,
): Record<string, unknown> {
  const opts = defaults(options);
  const engine = getEngine(language, opts);

  if (typeof engine.parse !== "function") {
    throw new TypeError(`expected "${language}.parse" to be a function`);
  }

  return engine.parse(str, opts);
}
