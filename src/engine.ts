import type { Engine, Engines, ResolvedOptions } from "./types.ts";

type BuiltinLanguage = "javascript" | "yaml";

/**
 * Alias map for engine names
 */
const ALIASES = {
  js: "javascript",
  javascript: "javascript",
  yaml: "yaml",
  yml: "yaml",
} as const satisfies Record<string, BuiltinLanguage>;

type AliasKey = keyof typeof ALIASES;

/**
 * Resolve engine alias to canonical name
 */
function alias(name: string): BuiltinLanguage | (string & {}) {
  const lower = name.toLowerCase();
  if (lower in ALIASES) {
    return ALIASES[lower as AliasKey];
  }
  return name;
}

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
  const engine = options.engines[name] ?? options.engines[alias(name)];

  if (engine === undefined) {
    throw new Error(`gray-matter engine "${name}" is not registered`);
  }

  return normalizeEngine(engine);
}
