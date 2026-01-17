import type { KnipConfig } from "knip";

export default {
  project: ["src/**/*.ts"],
  ignoreBinaries: ["oxfmt", "oxlint", "tsgo"],
  rules: {
    devDependencies: "warn",
  },
} satisfies KnipConfig;
