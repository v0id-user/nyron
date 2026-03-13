import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    // Main entry point
    index: "./src/index.ts",
    // Config system
    "config/index": "./src/config/index.ts",
    "config/types": "./src/config/types.ts",
    "config/define": "./src/config/define.ts",
    "config/loader": "./src/config/loader.ts",
    "config/parser": "./src/config/parser.ts",
    "config/validator": "./src/config/validator.ts",
    // Actions entry points
    "actions/bump": "./src/actions/bump.ts",
    "actions/init": "./src/actions/init.ts",
    "actions/types": "./src/actions/types.ts",
    // GitHub helpers
    "github/commits": "./src/github/commits.ts",
    "github/repo-parser": "./src/github/repo-parser.ts",
    "github/tags": "./src/github/tags.ts",
    "github/types": "./src/github/types.ts",
    // Git helpers
    "core/tag-parser": "./src/core/tag-parser.ts",
    "core/types": "./src/core/types.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  platform: "node",
  // Remove console and debugger on production build
  external: [
    // Dependencies
    "semver",
    "simple-git",
    "octokit",
    "commander",
    "dotenv",
    "cosmiconfig",
  ],
  sourcemap: true,
  clean: true,
  treeshake: true,
});