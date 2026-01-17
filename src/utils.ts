import { Buffer } from "node:buffer";

/**
 * Strip BOM (Byte Order Mark) from a string
 */
function stripBom(str: string): string {
  return str.charCodeAt(0) === 0xfeff ? str.slice(1) : str;
}

/**
 * Define a non-enumerable property on an object
 */
export function define<T extends object, K extends PropertyKey, V>(obj: T, key: K, val: V): void {
  Reflect.defineProperty(obj, key, {
    enumerable: false,
    configurable: true,
    writable: true,
    value: val,
  });
}

/**
 * Returns true if `val` is a Buffer
 */
function isBuffer(val: unknown): val is Buffer {
  return Buffer.isBuffer(val);
}

/**
 * Returns true if `val` is a plain object
 */
export function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

/**
 * Cast `input` to a Buffer
 */
export function toBuffer(input: string | Buffer): Buffer {
  return typeof input === "string" ? Buffer.from(input) : input;
}

/**
 * Cast `input` to a string, stripping BOM
 */
export function toString(input: string | Buffer): string {
  if (isBuffer(input)) return stripBom(String(input));
  if (typeof input !== "string") {
    throw new TypeError("expected input to be a string or buffer");
  }
  return stripBom(input);
}

/**
 * Cast `val` to an array
 */
export function arrayify<T>(val: T | T[] | undefined | null): T[] {
  return val ? (Array.isArray(val) ? val : [val]) : [];
}

/**
 * Returns true if `str` starts with `substr`
 */
export function startsWith(str: string, substr: string, len?: number): boolean {
  const length = typeof len === "number" ? len : substr.length;
  return str.slice(0, length) === substr;
}

if (import.meta.vitest) {
  describe("utils", () => {
    describe("stripBom", () => {
      it("should strip BOM from string", () => {
        expect(stripBom("\uFEFFhello")).toBe("hello");
      });

      it("should return string unchanged if no BOM", () => {
        expect(stripBom("hello")).toBe("hello");
      });
    });

    describe("isBuffer", () => {
      it("should return true for Buffer", () => {
        expect(isBuffer(Buffer.from("test"))).toBe(true);
      });

      it("should return false for string", () => {
        expect(isBuffer("test")).toBe(false);
      });
    });

    describe("isObject", () => {
      it("should return true for plain object", () => {
        expect(isObject({})).toBe(true);
        expect(isObject({ a: 1 })).toBe(true);
      });

      it("should return false for array", () => {
        expect(isObject([])).toBe(false);
      });

      it("should return false for null", () => {
        expect(isObject(null)).toBe(false);
      });
    });

    describe("arrayify", () => {
      it("should wrap non-array in array", () => {
        expect(arrayify("test")).toEqual(["test"]);
      });

      it("should return array unchanged", () => {
        expect(arrayify(["a", "b"])).toEqual(["a", "b"]);
      });

      it("should return empty array for null/undefined", () => {
        expect(arrayify(null)).toEqual([]);
        expect(arrayify(undefined)).toEqual([]);
      });
    });

    describe("startsWith", () => {
      it("should return true if string starts with substr", () => {
        expect(startsWith("---\nhello", "---")).toBe(true);
      });

      it("should return false if string does not start with substr", () => {
        expect(startsWith("hello", "---")).toBe(false);
      });
    });
  });
}
