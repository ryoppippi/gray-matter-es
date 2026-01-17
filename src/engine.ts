import type { Engine, Engines, ResolvedOptions } from "./types.ts";

/**
 * Normalize engine entry to Engine object
 */
function normalizeEngine(engine: Engines[string]): Engine {
  if (typeof engine === "function") {
    return { parse: engine };
  }
  return engine;
}

/**
 * Get engine by name from options
 */
export function getEngine(name: string, options: ResolvedOptions): Engine {
  const engine = options.engines[name];

  if (engine == null) {
    throw new Error(`gray-matter engine "${name}" is not registered`);
  }

  return normalizeEngine(engine);
}
