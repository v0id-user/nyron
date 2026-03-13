import {
  filterMetaCommits,
  parseCommits,
  organizCommitsForChangelog,
} from "../../src/core/commits-parser"
import { describe, it, expect } from "bun:test"

describe("commits-parser", () => {
  it("should parse a simple feat commit", () => {
    const commits = [
      {
        hash: "123",
        message: "feat: add feature",
        author: "John Doe",
        repo: "owner/repo",
        githubUser: "v0id-user",
        affectedFolders: [],
      }
    ]
    const result = parseCommits(commits)
    expect(result["Features"]?.["general"]).toBeDefined()
    expect(result["Features"]?.["general"]?.[0]?.message).toBe("add feature")
    expect(result["Features"]?.["general"]?.[0]?.author).toBe("John Doe")
    expect(result["Features"]?.["general"]?.[0]?.hash).toBe("123")
  })

  it("should parse a commit with scope", () => {
    const commits = [
      {
        hash: "456",
        message: "fix(core): fix bug",
        author: "Jane Doe",
        repo: "owner/repo",
        githubUser: "v0id-user",
        affectedFolders: [],
      }
    ]
    const result = parseCommits(commits)
    expect(result["Bug Fixes"]?.["core"]).toBeDefined()
    expect(result["Bug Fixes"]?.["core"]?.[0]?.message).toBe("fix bug")
    expect(result["Bug Fixes"]?.["core"]?.[0]?.scope).toBe("core")
  })

  it("should group multiple types and scopes", () => {
    const commits = [
      {
        hash: "1",
        message: "feat(ui): add button",
        author: "A",
        repo: "owner/repo",
        githubUser: "v0id-user",
        affectedFolders: [],
      },
      {
        hash: "2",
        message: "fix(api): fix endpoint",
        author: "B",
        repo: "owner/repo",
        githubUser: "v0id-user",
        affectedFolders: [],
      },
      {
        hash: "3",
        message: "docs: update readme",
        author: "C",
        githubUser: "v0id-user",
        repo: "owner/repo",
        affectedFolders: [],
      },
      {
        hash: "4",
        message: "refactor: cleanup code",
        author: "D",
        repo: "owner/repo",
        githubUser: "v0id-user",
        affectedFolders: [],
      }
    ]
    const result = parseCommits(commits)
    expect(result["Features"]?.["ui"]).toBeDefined()
    expect(result["Bug Fixes"]?.["api"]).toBeDefined()
    expect(result["Documentation"]?.["general"]).toBeDefined()
    expect(result["Refactoring"]?.["general"]).toBeDefined()
  })

  it("should bucket non-conventional commits as 'other'", () => {
    const commits = [
      {
        hash: "789",
        message: "random commit message",
        author: "E",
        repo: "owner/repo",
        affectedFolders: [],
        githubUser: "v0id-user",
      }
    ]
    const result = parseCommits(commits)
    expect(result["other"]?.["general"]).toBeDefined()
    expect(result["other"]?.["general"]?.[0]?.message).toBe("random commit message")
  })

  it("should parse commit with unusual type", () => {
    const commits = [
      {
        hash: "101",
        message: "build: update deps",
        author: "F",
        repo: "owner/repo",
        githubUser: "v0id-user",
        affectedFolders: [],
      }
    ]
    const result = parseCommits(commits)
    expect(result["Chores"]?.["general"]).toBeDefined()
    expect(result["Chores"]?.["general"]?.[0]?.message).toBe("update deps")
  })

  it("should parse commit with multi-word scope", () => {
    const commits = [
      {
        hash: "102",
        message: "feat(my-lib): add something",
        author: "G",
        repo: "owner/repo",
        githubUser: "v0id-user",
        affectedFolders: [],
      }
    ]
    const result = parseCommits(commits)
    expect(result["Features"]?.["my-lib"]).toBeDefined()
    expect(result["Features"]?.["my-lib"]?.[0]?.message).toBe("add something")
  })

  it("should parse commit with extra whitespace", () => {
    const commits = [
      {
        hash: "103",
        message: "  fix:   fix whitespace   ",
        author: "H",
        repo: "owner/repo",
        githubUser: "v0id-user",
        affectedFolders: [],
      }
    ]
    const result = parseCommits(commits)
    expect(result["Bug Fixes"]?.["general"]).toBeDefined()
    expect(result["Bug Fixes"]?.["general"]?.[0]?.message).toBe("fix whitespace")
  })

  it("should parse multiple commits of same type and scope", () => {
    const commits = [
      {
        hash: "201",
        message: "feat(core): add A",
        author: "I",
        repo: "owner/repo",
        githubUser: "v0id-user",
        affectedFolders: [],
      },
      {
        hash: "202",
        message: "feat(core): add B",
        author: "J",
        repo: "owner/repo",
        githubUser: "v0id-user",
        affectedFolders: [],
      }
    ]
    const result = parseCommits(commits)
    expect(result["Features"]?.["core"]).toBeDefined()
    expect(result["Features"]?.["core"]?.length).toBe(2)
    expect(result["Features"]?.["core"]?.[0]?.message).toBe("add A")
    expect(result["Features"]?.["core"]?.[1]?.message).toBe("add B")
  })
})

describe("organizeForChangelog", () => {
  it("should organize features, fixes, and chores", () => {
    const commits = [
      { hash: "1", message: "feat: add feature A", author: "A", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "2", message: "fix: fix bug B", author: "B", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "3", message: "chore: update deps", author: "C", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
    ]
    const parsed = parseCommits(commits)
    const organized = organizCommitsForChangelog(parsed)
    
    expect(organized.features.length).toBe(1)
    expect(organized.fixes.length).toBe(1)
    expect(organized.chores.length).toBe(1)
    expect(organized.features[0]).toContain("add feature A")
    expect(organized.fixes[0]).toContain("fix bug B")
    expect(organized.chores[0]).toContain("update deps")
  })

  it("should add scope labels for scoped commits", () => {
    const commits = [
      { hash: "1", message: "feat(ui): add button", author: "A", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "2", message: "fix(api): fix endpoint", author: "B", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "3", message: "docs(readme): update docs", author: "C", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
    ]
    const parsed = parseCommits(commits)
    const organized = organizCommitsForChangelog(parsed)
    
    expect(organized.features[0]).toContain("**ui**:")
    expect(organized.features[0]).toContain("add button")
    expect(organized.fixes[0]).toContain("**api**:")
    expect(organized.chores[0]).toContain("**readme**:")
  })

  it("should not add scope label for general scope", () => {
    const commits = [
      { hash: "1", message: "feat: add feature", author: "A", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "2", message: "fix: fix bug", author: "B", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
    ]
    const parsed = parseCommits(commits)
    const organized = organizCommitsForChangelog(parsed)
    
    expect(organized.features[0]).not.toContain("**general**:")
    expect(organized.fixes[0]).not.toContain("**general**:")
  })

  it("should categorize all non-feature/fix types as chores", () => {
    const commits = [
      { hash: "1", message: "docs: update readme", author: "A", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "2", message: "refactor: cleanup", author: "B", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "3", message: "perf: optimize", author: "C", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "4", message: "test: add tests", author: "D", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "5", message: "style: format", author: "E", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "6", message: "chore: misc", author: "F", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "7", message: "build: update config", author: "G", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "8", message: "random message", author: "H", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
    ]
    const parsed = parseCommits(commits)
    const organized = organizCommitsForChangelog(parsed)
    
    expect(organized.features).toEqual([])
    expect(organized.fixes).toEqual([])
    expect(organized.chores.length).toBe(8)
    // Check that messages are present (format changed to include author/hash)
    expect(organized.chores.some(c => c.includes("update readme"))).toBe(true)
    expect(organized.chores.some(c => c.includes("cleanup"))).toBe(true)
    expect(organized.chores.some(c => c.includes("optimize"))).toBe(true)
  })

  it("should handle multiple commits of same type with different scopes", () => {
    const commits = [
      { hash: "1", message: "feat(ui): add A", author: "A", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "2", message: "feat(api): add B", author: "B", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "3", message: "feat: add C", author: "C", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
    ]
    const parsed = parseCommits(commits)
    const organized = organizCommitsForChangelog(parsed)
    
    expect(organized.features.length).toBe(3)
    expect(organized.features[0]).toContain("**ui**:")
    expect(organized.features[1]).toContain("**api**:")
    expect(organized.features[2]).not.toContain("**")
  })

  it("should return empty arrays for an empty parsed commit map", () => {
    const organized = organizCommitsForChangelog({})
    
    expect(organized).toEqual({
      features: [],
      fixes: [],
      chores: []
    })
  })

  it("should handle mixed scopes and general in same type", () => {
    const commits = [
      { hash: "1", message: "fix(core): fix A", author: "A", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "2", message: "fix: fix B", author: "B", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
      { hash: "3", message: "fix(utils): fix C", author: "C", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
    ]
    const parsed = parseCommits(commits)
    const organized = organizCommitsForChangelog(parsed)
    
    expect(organized.fixes.length).toBe(3)
    expect(organized.fixes[0]).toContain("**core**:")
    expect(organized.fixes[1]).not.toContain("**")
    expect(organized.fixes[2]).toContain("**utils**:")
  })

  it("should include author and commit hash in output", () => {
    const commits = [
      { hash: "abc1234567", message: "feat: add feature", author: "John Doe", repo: "owner/repo", affectedFolders: [], githubUser: "v0id-user" },
    ]
    const parsed = parseCommits(commits)
    const organized = organizCommitsForChangelog(parsed)
    
    expect(organized.features[0]).toContain("@v0id-user")
    expect(organized.features[0]).toContain("abc1234") // short hash
    expect(organized.features[0]).toContain("https://github.com/")
  })
})

describe("filterMetaCommits", () => {
  it("removes version and changelog maintenance commits", () => {
    const commits = [
      { hash: "1", message: "feat: add dashboard", author: "A", repo: "owner/repo", affectedFolders: [] },
      { hash: "2", message: "chore: bump version to 1.2.0", author: "B", repo: "owner/repo", affectedFolders: [] },
      { hash: "3", message: "chore: update changelog", author: "C", repo: "owner/repo", affectedFolders: [] },
    ]

    expect(filterMetaCommits(commits as any)).toEqual([
      commits[0],
    ])
  })
})
