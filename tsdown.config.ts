import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  outDir: "dist",
  format: "esm",
  clean: true,
  sourcemap: true,
  treeshake: true,
  unbundle: true,
  dts: true,
  publint: true,
  unused: true,
  exports: {
    devExports: true,
  },
  nodeProtocol: true,
  define: {
    "import.meta.vitest": "undefined",
  },
});
