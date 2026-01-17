import { parse as yamlParse, stringify as yamlStringify } from "@std/yaml";
import type { Engine, Engines, GrayMatterOptions } from "./types.ts";

/**
 * YAML engine using @std/yaml
 */
const yaml = {
  parse: (str: string, _options?: GrayMatterOptions): Record<string, unknown> => {
    const result = yamlParse(str);
    return (result as Record<string, unknown>) ?? {};
  },
  stringify: (data: Record<string, unknown>, _options?: GrayMatterOptions): string => {
    return yamlStringify(data as Record<string, unknown>);
  },
} as const satisfies Engine;

/**
 * JSON engine
 */
const json = {
  parse: (str: string, _options?: GrayMatterOptions): Record<string, unknown> => {
    return JSON.parse(str) as Record<string, unknown>;
  },
  stringify: (
    data: Record<string, unknown>,
    options?: GrayMatterOptions & { replacer?: null; space?: number },
  ): string => {
    const opts = { replacer: null, space: 2, ...options };
    return JSON.stringify(data, opts.replacer, opts.space);
  },
} as const satisfies Engine;

/**
 * JavaScript engine (uses eval)
 */
const javascript = {
  parse: function parse(
    str: string,
    _options?: GrayMatterOptions,
    wrap: boolean = true,
  ): Record<string, unknown> {
    try {
      let code = str;
      if (wrap !== false) {
        code = "(function() {\nreturn " + str.trim() + ";\n}());";
      }
      // eslint-disable-next-line no-eval
      return (eval(code) as Record<string, unknown>) || {};
    } catch (err) {
      if (wrap !== false && err instanceof Error && /(unexpected|identifier)/i.test(err.message)) {
        return parse(str, _options, false);
      }
      throw new SyntaxError(String(err));
    }
  },
  stringify: (): never => {
    throw new Error("stringifying JavaScript is not supported");
  },
} as const satisfies Engine;

/**
 * Default engines
 */
export const engines = {
  yaml,
  json,
  javascript,
} as const satisfies Engines;
