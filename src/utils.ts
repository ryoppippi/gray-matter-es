import { Buffer } from "node:buffer";

/**
 * Strip BOM (Byte Order Mark) from a string
 */
function stripBom(str: string): string {
  return str.charCodeAt(0) === 0xfeff ? str.slice(1) : str;
}

/**
 * Returns true if `val` is a Buffer
 */
function isBuffer(val: unknown): val is Buffer {
  return Buffer.isBuffer(val);
}

/**
 * Returns true if `val` is a plain object (not a Buffer or other special object)
 */
export function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val) && !Buffer.isBuffer(val);
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
 * Asserts that `val` is a plain object and returns it typed as Record<string, unknown>
 * If `val` is not a plain object, returns an empty object
 */
export function toRecord(val: unknown): Record<string, unknown> {
  return isObject(val) ? val : {};
}

/**
 * Get a string property from an object with a default value
 */
export function getStringProp(obj: unknown, key: string, defaultValue = ""): string {
  if (!isObject(obj)) return defaultValue;
  const value = obj[key];
  return typeof value === "string" ? value : defaultValue;
}

if (import.meta.vitest) {
  describe("utils", () => {
    describe("toRecord", () => {
      it("should return object as-is", () => {
        const obj = { a: 1, b: "hello" };
        expect(toRecord(obj)).toBe(obj);
      });

      it("should return empty object for non-objects", () => {
        expect(toRecord(null)).toEqual({});
        expect(toRecord(undefined)).toEqual({});
        expect(toRecord("string")).toEqual({});
        expect(toRecord(123)).toEqual({});
        expect(toRecord([])).toEqual({});
      });
    });

    describe("getStringProp", () => {
      it("should return string property value", () => {
        expect(getStringProp({ name: "test" }, "name")).toBe("test");
      });

      it("should return default for missing property", () => {
        expect(getStringProp({ other: "value" }, "name")).toBe("");
        expect(getStringProp({ other: "value" }, "name", "default")).toBe("default");
      });

      it("should return default for non-string property", () => {
        expect(getStringProp({ count: 42 }, "count")).toBe("");
        expect(getStringProp({ flag: true }, "flag")).toBe("");
      });

      it("should return default for non-objects", () => {
        expect(getStringProp(null, "name")).toBe("");
        expect(getStringProp("string", "name")).toBe("");
      });
    });

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

      it("should return false for Buffer", () => {
        expect(isObject(Buffer.from("test"))).toBe(false);
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
  });
}
