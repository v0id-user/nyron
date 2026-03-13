# AGENTS.md

## Repo-specific instructions for AI agents

### PR titles and commit messages must use Conventional Commits

- Always use Conventional Commit format for both git commit messages and pull request titles:
  - `type(scope): description`
  - scope is optional when there is no clear subsystem
- Prefer the same high-level wording for the PR title and the final squashed commit title.
- This repository relies on changelog automation, and squash merges use the PR title as the merged commit title.
- Do not use generic PR titles like `Update docs`, `Fix stuff`, or `Agent setup and testing skill`.

Examples:

- `docs(skill): add cloud agent starter runbook`
- `fix(bot): resolve missing CLI export import`
- `feat(cli): add dry-run release summary`
- `chore: refresh Bun workspace dependencies`

### Commit regularly and split changes by concern

- Commit early and often. Do not accumulate large diffs spanning multiple concerns into a single commit.
- Each commit should represent one logical change: a single bug fix, a single feature addition, a single config update, or a single documentation change.
- If a task involves changes to multiple subsystems (e.g., docs config, turbo config, CI pipeline), split them into separate commits with appropriate scopes.
- Never mix unrelated changes in one commit. For example, do not combine a dependency update with a feature implementation.
- Prefer small, reviewable commits over large monolithic ones.

### Build and test before pushing

- Run `bun run build` at the repo root before pushing to verify all packages compile.
- Run `bun run test` to confirm existing tests pass.

### Before finishing work

- If a PR already exists for your branch, verify its title is Conventional Commit compliant.
- If it is not compliant, rename the PR before handing work back when your available tools allow it.
