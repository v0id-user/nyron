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

### Before finishing work

- If a PR already exists for your branch, verify its title is Conventional Commit compliant.
- If it is not compliant, rename the PR before handing work back when your available tools allow it.
