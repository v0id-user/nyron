import { describe, it, expect } from "bun:test"
import { generateChangelogMarkdown } from "../../src/changelog/generateChangelog"
import { parseCommits } from "../../src/core/commits-parser"
import type { CommitDiff } from "../../src/github/types"

describe("generateChangelogMarkdown", () => {
  it("should generate a changelog markdown with multiple conventional commits, PRs, and Issues", async () => {
    const commitsDiff: CommitDiff[] = [
      {
        message: "feat(core): add new API for user login Closes #87",
        author: "dev1",
        githubUser: "dev1",
        repo: "sample/repo",
        hash: "a1b2c3",
        affectedFolders: [
          "packages/core"
        ],
      },
      {
        message: "fix(auth): resolve incorrect token bug #95",
        author: "dev2",
        githubUser: "dev2",
        repo: "sample/repo",
        hash: "d4e5f6",
        affectedFolders: [
          "packages/auth"
        ],
      },
      {
        message: "chore: update dependencies",
        author: "bot[dep]",
        githubUser: "bot[dep]",
        repo: "sample/repo",
        hash: "g7h8i9",
        affectedFolders: [
          "packages/core"
        ],
      },
      {
        message: "feat(api): add pagination support (#126)",
        author: "dev3",
        githubUser: "dev3",
        repo: "sample/repo",
        hash: "j1k2l3",
        affectedFolders: [
          "packages/api"
        ],
      },
      {
        message: "fix: typo in README",
        author: "dev4",
        githubUser: "dev4",
        repo: "sample/repo",
        hash: "m4n5o6",
        affectedFolders: [
          "packages/docs",
          "packages/core"
        ]
      }
    ]

    const parsedCommits = parseCommits(commitsDiff)

    const changelog = await generateChangelogMarkdown(parsedCommits, [
      "core@1.0.0",
      "auth@2.1.0",
      "api@3.2.6"
    ])
    console.log(changelog)
    expect(changelog).toContain("# Changelog release notes")
    // Check that features are in changelog
    expect(changelog).toContain("✨ Features")
    expect(changelog).toContain("add new API for user login")
    expect(changelog).toContain("add pagination support")
    // Check fixes
    expect(changelog).toContain("🐛 Fixes")
    expect(changelog).toContain("resolve incorrect token bug")
    expect(changelog).toContain("typo in README")
    // Check chores
    expect(changelog).toContain("🧹 Chores")
    expect(changelog).toContain("update dependencies")
    expect(changelog).toContain("[@dev1](https://github.com/dev1)")
    expect(changelog).toContain("packages/docs, packages/core")
    expect(changelog).not.toContain("&lt;")
    expect(changelog).not.toContain("-&gt;")
  })
})

