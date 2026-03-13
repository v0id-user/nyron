---
name: cloud-agent-starter
description: Use this skill when starting work in the Nyron monorepo from Cursor Cloud and you need the fastest path to authenticate with GitHub, install dependencies, run the right app, and choose the right testing workflow for the CLI, docs site, or bot.
---

# Cloud Agent Starter

## When to use

- You just opened this repository in Cursor Cloud.
- You need the quickest working setup instead of exploring scripts by hand.
- You are about to edit one of the main codebase areas: `packages/cli`, `apps/docs`, or `apps/nyron-bot`.
- You need to know whether a task requires GitHub auth, live app startup, or mocks.

## Codebase map

- `packages/cli`: Nyron CLI package built with Bun.
- `apps/docs`: Next.js + Fumadocs documentation site.
- `apps/nyron-bot`: Probot GitHub app.
- repo root: Bun workspaces + Turbo entrypoint.

## Repo-wide startup checklist

Run these first unless you already know the environment is ready:

1. Go to the repo root.
   - `cd /workspace`
2. Confirm the branch and current worktree state before touching anything.
   - `git branch --show-current`
   - `git status --short`
3. Confirm Bun is available.
   - `bun --version`
4. Install dependencies from the repo root.
   - `bun install`
5. Check GitHub CLI auth.
   - `gh auth status`

### GitHub login and token setup

- Cursor Cloud commonly starts with `gh` already authenticated. Check with `gh auth status` before assuming you need anything else.
- The Nyron CLI reads `GITHUB_TOKEN` directly for GitHub-backed commands such as release creation.
- Preferred setup for GitHub-backed CLI work:
  - export a token provided through the environment or secret manager
  - then verify it without printing it:
    - `test -n "$GITHUB_TOKEN" && echo "GITHUB_TOKEN is set"`
- Useful Cloud shortcut when the environment permits reusing the authenticated GitHub CLI session:
  - `export GITHUB_TOKEN="$(gh auth token)"`
- If `gh auth status` fails and the task does not need GitHub API calls, continue with offline tests instead of blocking on login.

## Common workflow notes

- Default package manager is Bun. Prefer `bun install`, `bun run ...`, and `bun test`.
- The repo root `bun run dev` uses Turbo. Use it only when you intentionally want repo-level orchestration.
- For most tasks, start only the codebase area you are changing instead of booting everything.
- No first-class feature flag system is present in the repository today. If a task mentions a feature flag:
  - look for task-specific context first
  - otherwise use mocks, fixtures, or a temporary config file instead of hunting for a missing flag framework

## Area: repo root

Use the root only for dependency install, repo-wide build/lint runs, or Turbo orchestration.

### Useful commands

- Install all workspace dependencies:
  - `cd /workspace && bun install`
- Repo-wide build:
  - `cd /workspace && bun run build`
- Repo-wide lint:
  - `cd /workspace && bun run lint`
- Repo-wide dev orchestration:
  - `cd /workspace && bun run dev`

### When to use root scripts

- Use root `build` or `lint` before finishing changes that touch multiple workspaces.
- Skip root `dev` for focused work unless you specifically need Turbo to orchestrate workspace dev servers.

## Area: `packages/cli`

Use this area for version bumps, changelog generation, config loading, tag logic, GitHub release logic, and CLI entrypoint changes.

### Setup

1. Enter the package:
   - `cd /workspace/packages/cli`
2. Build the distributable:
   - `bun run build`
3. Smoke-check the compiled CLI:
   - `bun dist/index.js --help`

### Auth expectations

- `GITHUB_TOKEN` is required for GitHub-backed flows such as `release`.
- Many local logic changes do not require auth:
  - config parsing
  - semver logic
  - changelog grouping
  - init command tests

### Recommended testing workflows

#### Fast logic regression

Use this after changing parser, config, changelog, semver, or command logic:

- `cd /workspace/packages/cli && bun test`

#### Build and compiled-entry smoke test

Use this after changing the CLI entrypoint, exports, build config, or command registration:

- `cd /workspace/packages/cli && bun run build`
- `cd /workspace/packages/cli && bun dist/index.js --help`

#### GitHub-backed release work

Use this only when the task actually touches release behavior:

1. Ensure `GITHUB_TOKEN` is set.
2. Prefer a dry run before any real release attempt.
3. Expect the command to need a valid `nyron.config.ts` and relevant tag history.

Suggested order:

- `cd /workspace/packages/cli && bun test`
- `cd /workspace/packages/cli && bun run build`
- run the GitHub-backed command only after auth and repo state are ready

### Practical advice

- If you only changed pure logic, stay in tests and compiled help output.
- If a release-flow test would need real tags or GitHub side effects, use dry-run or unit tests first.

## Area: `apps/docs`

Use this area for documentation content, page layout, search route, docs navigation, and site styling.

### Setup

1. Enter the app:
   - `cd /workspace/apps/docs`
2. Start the dev server:
   - `bun run dev`
3. Open the local site:
   - `http://localhost:3000`

### Notes

- This app is the main browser-based surface in the repo.
- `postinstall` runs `fumadocs-mdx`, so a fresh `bun install` at the repo root is the normal first step after checkout.
- No auth or feature-flag setup is required for ordinary docs work.

### Recommended testing workflows

#### Content-only or MDX changes

- `cd /workspace/apps/docs && bun run lint`
- `cd /workspace/apps/docs && bun run build`

Also manually open the changed route in the browser when the task affects rendered content or navigation.

#### Layout, styling, or route-handler changes

1. Start the dev server:
   - `cd /workspace/apps/docs && bun run dev`
2. Open the affected page in the browser.
3. Verify the changed route visually.
4. Finish with:
   - `cd /workspace/apps/docs && bun run lint`
   - `cd /workspace/apps/docs && bun run build`

### Quick route checklist

- Home page: `/`
- Docs index: `/docs`
- Changed document slug under `/docs/...`

## Area: `apps/nyron-bot`

Use this area for GitHub webhook handlers, PR parsing, comment generation, and Probot integration.

### Setup

1. Enter the app:
   - `cd /workspace/apps/nyron-bot`
2. Build the TypeScript output:
   - `bun run build`
3. Run the automated tests:
   - `bun run test`

### Live app startup

The bot can run locally, but live webhook testing is not the default starting point for Cloud work.

- Start the app:
  - `cd /workspace/apps/nyron-bot && bun run start`
- If you do not already have GitHub App credentials, do not spend time forcing a live boot. Use the mocked tests first.

### Credentials and mocking guidance

- The live Probot flow usually needs GitHub App credentials such as:
  - `APP_ID`
  - `PRIVATE_KEY`
  - `WEBHOOK_SECRET`
- If those values are unavailable, use the existing mocked webhook tests instead of trying to improvise secrets.
- This app already has fixture-based tests, so mocked validation is the normal safe path for Cloud agents.

### Recommended testing workflows

#### Standard bot change workflow

- `cd /workspace/apps/nyron-bot && bun run build`
- `cd /workspace/apps/nyron-bot && bun run test`

#### Webhook-handler work

Use the mocked tests first. Only attempt live GitHub delivery if credentials and a webhook forwarding setup are already available.

Recommended order:

1. `cd /workspace/apps/nyron-bot && bun run build`
2. `cd /workspace/apps/nyron-bot && bun run test`
3. only then consider `bun run start` for manual verification

## Choosing the right workflow fast

- Changed docs content or docs UI:
  - work in `apps/docs`
  - run `bun run lint` and `bun run build`
  - manually open the changed route
- Changed CLI logic:
  - work in `packages/cli`
  - run `bun test`
  - then `bun run build` and `bun dist/index.js --help`
- Changed bot logic:
  - work in `apps/nyron-bot`
  - run `bun run build`
  - then `bun run test`
- Changed multiple workspaces:
  - finish with repo-root `bun run build`

## How to update this skill

Whenever you discover a new testing trick, startup shortcut, or runbook detail, update this skill in the same PR.

Rules for updating:

1. Put the tip under the correct codebase area instead of adding a random notes dump.
2. Include the exact command, working directory, and any required env vars.
3. Say whether the workflow is:
   - offline-safe
   - GitHub/network-dependent
   - browser/manual
4. Record mock or fixture shortcuts whenever they save Cloud-agent time.
5. Delete stale instructions as soon as scripts, ports, or auth expectations change.

Good update example:

- add a new subsection like `Release dry-run workflow`
- list the exact command sequence
- include the success signal the next agent should look for
