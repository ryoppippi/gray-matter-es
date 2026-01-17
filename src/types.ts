/**
 * Engine interface for parsing and stringifying front matter
 */
export interface Engine {
  parse: (str: string) => Record<string, unknown>;
  stringify?: (data: Record<string, unknown>) => string;
}

/**
 * Options for gray-matter
 */
export interface GrayMatterOptions {
  /** Language to use for parsing (default: 'yaml') */
  language?: "yaml" | "json";
  /** Delimiters for front matter (default: '---') */
  delimiters?: string | [string, string];
  /**
   * Extract an excerpt from the content.
   * - `true`: use the default delimiter
   * - `string`: use this string as the delimiter
   * - `function`: custom excerpt function
   */
  excerpt?: boolean | string | ((file: GrayMatterFile, options: GrayMatterOptions) => void);
  /** Separator for excerpt in file.data */
  excerpt_separator?: string;
  /** Data to merge with parsed data */
  data?: Record<string, unknown>;
}

/**
 * Resolved options with defaults applied
 */
export interface ResolvedOptions extends GrayMatterOptions {
  delimiters: [string, string];
  language: "yaml" | "json";
}

/**
 * The file object returned by gray-matter
 */
export interface GrayMatterFile {
  /** The parsed front matter data */
  data: Record<string, unknown>;
  /** The content after front matter */
  content: string;
  /** The extracted excerpt (if enabled) */
  excerpt: string;
  /** The original input as a Uint8Array */
  orig: Uint8Array;
  /** The detected/specified language */
  language: string;
  /** The raw front matter string (without delimiters) */
  matter: string;
  /** True if front matter block was empty */
  isEmpty: boolean;
  /** The original content if isEmpty is true */
  empty?: string;
  /** Stringify the file back to a string */
  stringify: (data?: Record<string, unknown>, options?: GrayMatterOptions) => string;
}

/**
 * Input that can be passed to gray-matter
 */
export type GrayMatterInput =
  | string
  | Uint8Array
  | { content: string; data?: Record<string, unknown> };

/**
 * The matter function interface with static methods
 */
export interface MatterFunction {
  (input: GrayMatterInput, options?: GrayMatterOptions): GrayMatterFile;
  stringify: (
    file: GrayMatterFile | string,
    data?: Record<string, unknown>,
    options?: GrayMatterOptions,
  ) => string;
  test: (str: string, options?: GrayMatterOptions) => boolean;
  language: (str: string, options?: GrayMatterOptions) => { raw: string; name: string };
  clearCache: () => void;
  cache: Map<string, GrayMatterFile>;
}
