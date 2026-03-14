import { afterEach, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test"

const originalGitHubToken = process.env["GITHUB_TOKEN"]
const originalGhToken = process.env["GH_TOKEN"]
const mockExecFileSync = mock(() => "ghs_from_gh_cli\n")

mock.module("node:child_process", () => ({
  execFileSync: mockExecFileSync,
}))

let hasGitHubToken: typeof import("../../src/github/types").hasGitHubToken
let resolveGitHubToken: typeof import("../../src/github/types").resolveGitHubToken
let resetGitHubAuthCacheForTests: typeof import("../../src/github/types").resetGitHubAuthCacheForTests

beforeAll(async () => {
  ;({
    hasGitHubToken,
    resolveGitHubToken,
    resetGitHubAuthCacheForTests,
  } = await import("../../src/github/types"))
})

describe("github auth helpers", () => {
  beforeEach(() => {
    if (originalGitHubToken === undefined) {
      delete process.env["GITHUB_TOKEN"]
    } else {
      process.env["GITHUB_TOKEN"] = originalGitHubToken
    }

    if (originalGhToken === undefined) {
      delete process.env["GH_TOKEN"]
    } else {
      process.env["GH_TOKEN"] = originalGhToken
    }

    mockExecFileSync.mockClear()
    mockExecFileSync.mockReturnValue("ghs_from_gh_cli\n")
    resetGitHubAuthCacheForTests()
  })

  afterEach(() => {
    resetGitHubAuthCacheForTests()
  })

  it("prefers GITHUB_TOKEN when it is already set", () => {
    process.env["GITHUB_TOKEN"] = "ghs_from_env"

    expect(resolveGitHubToken()).toBe("ghs_from_env")
    expect(mockExecFileSync).not.toHaveBeenCalled()
  })

  it("falls back to gh auth token when env vars are missing", () => {
    delete process.env["GITHUB_TOKEN"]
    delete process.env["GH_TOKEN"]

    expect(resolveGitHubToken()).toBe("ghs_from_gh_cli")
    expect(hasGitHubToken()).toBe(true)
    expect(mockExecFileSync).toHaveBeenCalledWith("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
  })

  it("returns false when neither env vars nor gh auth are available", () => {
    delete process.env["GITHUB_TOKEN"]
    delete process.env["GH_TOKEN"]
    mockExecFileSync.mockImplementationOnce(() => {
      throw new Error("gh not logged in")
    })

    expect(resolveGitHubToken()).toBeUndefined()
    expect(hasGitHubToken()).toBe(false)
  })
})
