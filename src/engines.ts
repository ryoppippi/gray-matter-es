import { parse as yamlParse, stringify as yamlStringify } from "@std/yaml";
import type { Engine, Engines, GrayMatterOptions } from "./types.ts";

/**
 * YAML engine using @std/yaml
 */
const yaml: Engine = {
  parse: (str: string, _options?: GrayMatterOptions) => {
    const result = yamlParse(str);
    return (result as Record<string, unknown>) ?? {};
  },
  stringify: (data: Record<string, unknown>, _options?: GrayMatterOptions) => {
    return yamlStringify(data as Record<string, unknown>);
  },
};

/**
 * JSON engine
 */
const json: Engine = {
  parse: (str: string, _options?: GrayMatterOptions) => {
    return JSON.parse(str) as Record<string, unknown>;
  },
  stringify: (
    data: Record<string, unknown>,
    options?: GrayMatterOptions & { replacer?: null; space?: number },
  ) => {
    const opts = { replacer: null, space: 2, ...options };
    return JSON.stringify(data, opts.replacer, opts.space);
  },
};

/**
 * JavaScript engine (uses eval)
 */
const javascript: Engine = {
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
  stringify: () => {
    throw new Error("stringifying JavaScript is not supported");
  },
};

/**
 * Default engines
 */
export const engines: Engines = {
  yaml,
  json,
  javascript,
};
