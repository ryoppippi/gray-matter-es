# Testing Details

## Property-Based Testing with fast-check

This project uses `@fast-check/vitest` for property-based testing. Import it dynamically within the test block:

```typescript
if (import.meta.vitest) {
  const { fc, test } = await import("@fast-check/vitest");

  describe("my module", () => {
    // Regular test
    it("should work for specific case", () => {
      expect(myFunc("hello")).toBe("HELLO");
    });

    // Property-based test
    test.prop([fc.string()])("should work for any string", (input) => {
      expect(typeof myFunc(input)).toBe("string");
    });
  });
}
```

Property-based tests are useful for:

- Round-trip serialization (parse → stringify → parse)
- Input equivalence (Buffer vs string)
- Edge case discovery (prototype pollution, special characters)
