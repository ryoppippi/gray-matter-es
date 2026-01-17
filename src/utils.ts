const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Strip BOM (Byte Order Mark) from a string
 */
function stripBom(str: string): string {
  return str.charCodeAt(0) === 0xfeff ? str.slice(1) : str;
}

/**
 * Returns true if `val` is a Uint8Array
 */
function isUint8Array(val: unknown): val is Uint8Array {
  return val instanceof Uint8Array;
}

/**
 * Returns true if `val` is a plain object (not a Uint8Array or other special object)
 */
export function isObject(val: unknown): val is Record<string, unknown> {
  return (
    typeof val === "object" && val !== null && !Array.isArray(val) && !(val instanceof Uint8Array)
  );
}

/**
 * Cast `input` to a Uint8Array
 */
export function toUint8Array(input: string | Uint8Array): Uint8Array {
  return typeof input === "string" ? textEncoder.encode(input) : input;
}

/**
 * Cast `input` to a string, stripping BOM
 */
export function toString(input: string | Uint8Array): string {
  if (isUint8Array(input)) return stripBom(textDecoder.decode(input));
  if (typeof input !== "string") {
    throw new TypeError("expected input to be a string or Uint8Array");
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

    describe("isUint8Array", () => {
      it("should return true for Uint8Array", () => {
        expect(isUint8Array(new Uint8Array([1, 2, 3]))).toBe(true);
      });

      it("should return false for string", () => {
        expect(isUint8Array("test")).toBe(false);
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

      it("should return false for Uint8Array", () => {
        expect(isObject(new Uint8Array([1, 2, 3]))).toBe(false);
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
