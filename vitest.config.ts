import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    watch: false,
    includeSource: ["src/**/*.{js,ts}"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "html"],
      include: ["src/**/*.ts"],
      exclude: ["**/index.ts", "**/types.ts"],
    },
  },
});
