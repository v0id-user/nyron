import { describe, it, expect } from "vitest"
import { buildProjectChangesComment } from "../src/utils/buildProjectChangesComment.js"
import type { ProjectChange } from "../src/hooks/types.js"

describe("buildProjectChangesComment", () => {
  it("renders impacted and unchanged projects with actionable guidance", () => {
    const projectChanges: ProjectChange[] = [
      {
        projectName: "cli",
        path: "packages/cli",
        impacted: true,
        changedFolders: ["packages/cli", "packages/cli/src"],
        tagPrefix: "cli@",
      },
      {
        projectName: "core",
        path: "packages/core",
        impacted: false,
        changedFolders: [],
        tagPrefix: "core@",
      },
    ]

    const comment = buildProjectChangesComment(projectChanges, {
      owner: "v0id-user",
      repo: "nyron-1-test-repo",
      baseSha: "base123",
      headSha: "head456",
    })

    expect(comment).toContain("## Nyron project impact")
    expect(comment).toContain("| Project | Path | Impacted | Changed folders |")
    expect(comment).toContain("| cli | `packages/cli` | Yes | 2 |")
    expect(comment).toContain("| core | `packages/core` | No | — |")
    expect(comment).toContain("### Impacted projects")
    expect(comment).toContain("**cli** (`packages/cli`)")
    expect(comment).toContain("nyron bump --project cli")
    expect(comment).toContain("### Unchanged projects")
    expect(comment).toContain("**core** (`packages/core`)")
    expect(comment).toContain("/v0id-user/nyron-1-test-repo/compare/base123...head456")
  })

  it("handles empty project list", () => {
    const comment = buildProjectChangesComment([], {
      owner: "owner",
      repo: "repo",
    })

    expect(comment).toContain("## Nyron project impact")
    expect(comment).toContain("| Project | Path | Impacted | Changed folders |")
  })
})
