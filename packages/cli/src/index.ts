#!/usr/bin/env bun
import { program } from "commander"
import { bump } from "./actions/bump"
import { init } from "./actions/init"
import { release } from "./actions/release"
import { BumpType } from "./core/types"
import { pushNyronReleaseTagAction } from "./actions/pushTag"
import { version } from '../package.json'
import { fix } from "./actions/fix"
import { runCommand } from "./core/command"

import dotenv from "dotenv"

dotenv.config({
  quiet: true,
})

program
  .name("nyron")
  .description("Version packages, create release boundaries, and publish GitHub releases.")
  .version(version)
  .showSuggestionAfterError()
  .showHelpAfterError()
  .addHelpText(
    "after",
    `
Examples:
  $ nyron init
  $ nyron bump --type minor
  $ nyron bump --type patch --project cli
  $ nyron push-tag
  $ nyron release --dry-run
  $ nyron release --use-existing-tag
`,
  )

// -----------------------------
// bump
// -----------------------------
program
  .command("bump")
  .description("Bump a configured project version.")
  .requiredOption("-t, --type <type>", `Bump type: ${BumpType.join(", ")}`)
  .option("-p, --project <project>", "Configured project id/key from nyron.config.ts")
  .addHelpText(
    "after",
    `
Examples:
  $ nyron bump --type minor
  $ nyron bump --type patch --project cli

Notes:
  - If your config only contains one project, --project can be omitted.
  - Use the project key from nyron.config.ts, not the tag prefix.
`,
  )
  .action(runCommand(bump))


// -----------------------------
// init
// -----------------------------
program
  .command("init")
  .description("Create nyron.config.ts and initialize .nyron metadata.")
  .option("-f, --force", "Overwrite existing config")
  .addHelpText(
    "after",
    `
Examples:
  $ nyron init
  $ nyron init --force

This command creates a usable first-run setup:
  - nyron.config.ts
  - .nyron/meta.json
  - .nyron/versions.json
`,
  )
  .action(runCommand(init))

// -----------------------------
// Release
// -----------------------------
program
  .command("release")
  .description("Generate release notes and optionally publish a GitHub release.")
  .option("-d, --dry-run", "Dry run the release")
  .option("-n, --use-existing-tag", "Use the latest existing Nyron release tag as the release boundary")
  .addHelpText(
    "after",
    `
Examples:
  $ nyron release --dry-run
  $ nyron release
  $ nyron release --use-existing-tag

Notes:
  - Use --use-existing-tag after running 'nyron push-tag'.
  - Dry-runs can work from local git history.
  - Publishing a GitHub release requires GITHUB_TOKEN.
`,
  )
  .action(runCommand(release))

// -----------------------------
// pushTag
// -----------------------------
program
  .command("push-tag")
  .description("Create and push a new Nyron release boundary tag.")
  .addHelpText(
    "after",
    `
Example:
  $ nyron push-tag

Use this when you want to mark a release boundary before running:
  $ nyron release --use-existing-tag
`,
  )
  .action(runCommand(pushNyronReleaseTagAction))

// -----------------------------
// fix
// -----------------------------
program
  .command("fix")
  .description("Repair Nyron metadata, config drift, and missing bootstrap files.")
  .addHelpText(
    "after",
    `
Example:
  $ nyron fix

Use this after editing nyron.config.ts manually or when .nyron state is missing.
`,
  )
  .action(runCommand(fix))

// -----------------------------
// default help
// -----------------------------
program.parse()
