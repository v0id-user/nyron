# Nyron

**The easiest way to start versioning.**

Nyron automates changelogs, tagging, and releases—powered by your commits, not ceremony. Stay focused on building; Nyron handles the order.

## Features

- ✅ **Automatic changelog generation** from conventional commits
- ✅ **Smart commit grouping** (Features, Bug Fixes, Chores, etc.)
- ✅ **Multi-package support** for monorepos
- ✅ **GitHub integration** for author attribution and commit links
- ✅ **GPG signing support** for verified releases
- ✅ **CI/CD workflows** for automated releases

## Quick Start

### Install

```bash
bun add -D @nyron/cli
# or
npm install -D @nyron/cli
```

### Initialize

```bash
npx @nyron/cli init
```

This creates:

- `nyron.config.ts`
- `.nyron/meta.json`
- `.nyron/versions.json`

### Bump a Version

```bash
npx @nyron/cli bump --type minor
# or, for multi-project repos
npx @nyron/cli bump --type minor --project cli
```

### Create a Release Boundary

```bash
npx @nyron/cli push-tag
```

### Preview or Publish a Release

```bash
# Preview locally from git history
npx @nyron/cli release --dry-run

# Publish to GitHub using the tag you already pushed
npx @nyron/cli release --use-existing-tag
```

### Setup GitHub Token for Publishing

Publishing GitHub releases requires `GITHUB_TOKEN`:

```bash
echo "GITHUB_TOKEN=your_github_token_here" > .env
```

Generate a token at [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens)

### Typical Workflow

```bash
# 1. Bump a version
npx @nyron/cli bump --type minor

# 2. Commit changes
git add . && git commit -m "chore: bump version to 1.2.0"

# 3. Push a Nyron release boundary
npx @nyron/cli push-tag

# 4. Publish the GitHub release
npx @nyron/cli release --use-existing-tag
```

## Documentation

**📚 Full documentation available at [nyron.dev](https://nyron.dev/)**

- [Getting Started](https://nyron.dev/docs/getting-started/quickstart)
- [Configuration](https://nyron.dev/docs/getting-started/configuration)
- [Commands](https://nyron.dev/docs/commands)
- [Workflows](https://nyron.dev/docs/guides/workflow)
- [Conventional Commits](https://nyron.dev/docs/guides/conventional-commits)

## Requirements

- Git repository
- Conventional commit format: `type(scope): message`
- GitHub personal access token for GitHub release publishing

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

ISC

---

**Built with <3 by [@v0id-user](https://github.com/v0id-user)**

Stay focused on building. Nyron handles the order.
