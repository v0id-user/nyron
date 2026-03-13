# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Nyron is a Turborepo monorepo with three packages managed by **Bun** (v1.2.21):

| Package | Path | Description |
|---|---|---|
| `@nyron/cli` | `packages/cli` | Core CLI for versioning, changelog, and releases |
| `@nyron/docs` | `apps/docs` | Next.js 15 documentation site (Fumadocs) |
| `@nyron/bot` | `apps/nyron-bot` | GitHub App (Probot) for PR analysis |

### Running services

- **Docs dev server**: `bun run dev` from `apps/docs` (serves on port 3000)
- **CLI build + run**: `bun run build` in `packages/cli`, then `bun dist/index.js <command>` from that directory
- **Full build**: `bun run build` from repo root (runs `turbo build`); the bot build has pre-existing TS errors (`@nyron/cli/github/diff` and `@nyron/cli/github/tags` exports are missing) — this is a known upstream issue, not an environment problem.

### Lint / Test / Build

- **Lint**: `bun run lint` from repo root (runs `turbo lint`). Only the docs app has an ESLint config.
- **Tests (CLI)**: `bun test` in `packages/cli` — runs Bun's built-in test runner. 4 pre-existing test failures exist (meta schema tests and commits-parser edge cases).
- **Tests (Bot)**: `bun run test` in `apps/nyron-bot` — runs Vitest. Tests fail due to the same missing CLI exports noted above.
- **Build**: `bun run build` from repo root. CLI build succeeds; bot build fails (pre-existing).

### Gotchas

- Bun's `isolated` linker (set in `bunfig.toml`) can cause ESLint to miss transitive peer deps. If ESLint reports missing plugins (e.g., `eslint-plugin-react-hooks`, `@next/eslint-plugin-next`), install them explicitly in `apps/docs` as devDependencies, matching the version expected by `eslint-config-next@15.5.4`.
- The CLI binary entry (`dist/index.js`) is built with `--target bun`; run it with `bun dist/index.js`, not `node`.
