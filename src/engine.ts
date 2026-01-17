import type { Engine, ResolvedOptions } from "./types.ts";

/**
 * Resolve engine alias to canonical name
 */
function alias(name: string): string {
  switch (name.toLowerCase()) {
    case "js":
    case "javascript":
      return "javascript";
    case "yaml":
    case "yml":
      return "yaml";
    default:
      return name;
  }
}

/**
 * Get engine by name from options
 */
export function getEngine(name: string, options: ResolvedOptions): Engine {
  let engine = options.engines[name] ?? options.engines[alias(name)];

  if (engine === undefined) {
    throw new Error(`gray-matter engine "${name}" is not registered`);
  }

  if (typeof engine === "function") {
    engine = { parse: engine };
  }

  return engine;
}
