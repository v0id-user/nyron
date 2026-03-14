import { afterEach, beforeAll, beforeEach, describe, expect, it, mock, spyOn } from "bun:test"

const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {})
const mockConsoleWarn = spyOn(console, "warn").mockImplementation(() => {})
const originalGitHubToken = process.env["GITHUB_TOKEN"]

const mockLoadConfig = mock(() =>
  Promise.resolve({
    config: {
      repo: "acme/example",
      projects: {
        cli: {
          tagPrefix: "@acme/cli@",
          path: "packages/cli",
        },
      },
    },
    filepath: "/tmp/nyron.config.ts",
    isEmpty: false,
  }),
)

const mockGetInvalidNyronReleaseTags = mock(() => Promise.resolve([]))
const mockGetLatestNyronReleaseTag = mock(() =>
  Promise.resolve("nyron-release@2026-01-02@00-00-00.000"),
)
const mockGetPreviousLatestNyronReleaseTag = mock(() =>
  Promise.resolve("nyron-release@2026-01-01@00-00-00.000"),
)
const mockGetFirstCommitHash = mock(() => Promise.resolve("abcdef1234567890"))
const mockGetCommitsBetween = mock(() =>
  Promise.resolve([
    {
      hash: "abc123",
      message: "feat(cli): add release polish",
      author: "Test User <test@example.com>",
      repo: "acme/example",
      affectedFolders: ["packages/cli"],
    },
  ]),
)
const mockGetCommitsSince = mock(() =>
  Promise.resolve([
    {
      hash: "def456",
      message: "fix(cli): tighten release flow",
      author: "Test User <test@example.com>",
      repo: "acme/example",
      affectedFolders: ["packages/cli"],
    },
  ]),
)
const mockGetCommitsUntil = mock(() =>
  Promise.resolve([
    {
      hash: "root001",
      message: "feat(cli): first release history",
      author: "Test User <test@example.com>",
      repo: "acme/example",
      affectedFolders: ["packages/cli"],
    },
  ]),
)
const mockGenerateChangelogMarkdown = mock(() => Promise.resolve("## Features"))
const mockGetUpdatedVersions = mock(() =>
  Promise.resolve(["cli@1.2.3 -> cli@1.2.4"]),
)
const mockCreateRelease = mock(() => Promise.resolve({}))
const mockPushNyronReleaseTag = mock(() =>
  Promise.resolve({ tag: "nyron-release@2026-01-03@00-00-00.000" }),
)
const mockSetMetaLatestTag = mock(() => Promise.resolve())

mock.module("../../src/config", () => ({
  loadConfig: mockLoadConfig,
}))

mock.module("../../src/git/tags", () => ({
  getInvalidNyronReleaseTags: mockGetInvalidNyronReleaseTags,
  getLatestNyronReleaseTag: mockGetLatestNyronReleaseTag,
  getPreviousLatestNyronReleaseTag: mockGetPreviousLatestNyronReleaseTag,
  getFirstCommitHash: mockGetFirstCommitHash,
}))

mock.module("../../src/github/commits", () => ({
  getCommitsBetween: mockGetCommitsBetween,
  getCommitsSince: mockGetCommitsSince,
  getCommitsUntil: mockGetCommitsUntil,
}))

mock.module("../../src/core/commits-parser", () => ({
  filterMetaCommits: (commits: unknown[]) => commits,
  parseCommits: mock((commits: unknown[]) => commits),
}))

mock.module("../../src/changelog/generateChangelog", () => ({
  generateChangelogMarkdown: mockGenerateChangelogMarkdown,
}))

mock.module("../../src/nyron/version", () => ({
  getUpdatedVersions: mockGetUpdatedVersions,
}))

mock.module("../../src/github/release", () => ({
  createRelease: mockCreateRelease,
}))

mock.module("../../src/github/tags", () => ({
  pushNyronReleaseTag: mockPushNyronReleaseTag,
}))

mock.module("../../src/nyron/meta/writer", () => ({
  setMetaLatestTag: mockSetMetaLatestTag,
}))

let release: typeof import("../../src/actions/release").release

beforeAll(async () => {
  ;({ release } = await import("../../src/actions/release"))
})

describe("release", () => {
  afterEach(() => {
    if (originalGitHubToken === undefined) {
      delete process.env["GITHUB_TOKEN"]
      return
    }

    process.env["GITHUB_TOKEN"] = originalGitHubToken
  })

  beforeEach(() => {
    mockConsoleLog.mockClear()
    mockConsoleWarn.mockClear()
    mockLoadConfig.mockClear()
    mockGetInvalidNyronReleaseTags.mockClear()
    mockGetLatestNyronReleaseTag.mockClear()
    mockGetPreviousLatestNyronReleaseTag.mockClear()
    mockGetFirstCommitHash.mockClear()
    mockGetCommitsBetween.mockClear()
    mockGetCommitsSince.mockClear()
    mockGetCommitsUntil.mockClear()
    mockGenerateChangelogMarkdown.mockClear()
    mockGetUpdatedVersions.mockClear()
    mockCreateRelease.mockClear()
    mockPushNyronReleaseTag.mockClear()
    mockSetMetaLatestTag.mockClear()

    mockGetInvalidNyronReleaseTags.mockResolvedValue([])
    mockGetPreviousLatestNyronReleaseTag.mockResolvedValue(
      "nyron-release@2026-01-01@00-00-00.000",
    )
    process.env["GITHUB_TOKEN"] = "test-token"
  })

  it("uses repository start for the first --use-existing-tag release", async () => {
    mockGetPreviousLatestNyronReleaseTag.mockResolvedValueOnce(null)

    await release({ useExistingTag: true, dryRun: true })

    expect(mockGetFirstCommitHash).toHaveBeenCalledTimes(1)
    expect(mockGetCommitsUntil).toHaveBeenCalledWith(
      "nyron-release@2026-01-02@00-00-00.000",
      "acme/example",
    )
    expect(mockGetCommitsBetween).not.toHaveBeenCalled()
    expect(mockCreateRelease).not.toHaveBeenCalled()
  })

  it("does not create a new boundary tag after publishing with --use-existing-tag", async () => {
    await release({ useExistingTag: true })

    expect(mockCreateRelease).toHaveBeenCalledWith(
      "acme/example",
      "nyron-release@2026-01-02@00-00-00.000",
      "## Features",
    )
    expect(mockPushNyronReleaseTag).not.toHaveBeenCalled()
    expect(mockSetMetaLatestTag).not.toHaveBeenCalled()
  })

  it("still creates the next boundary tag for the standard publish flow", async () => {
    await release({})

    expect(mockGetCommitsSince).toHaveBeenCalledWith(
      "nyron-release@2026-01-02@00-00-00.000",
      "acme/example",
    )
    expect(mockPushNyronReleaseTag).toHaveBeenCalledWith("acme/example")
    expect(mockSetMetaLatestTag).toHaveBeenCalledWith(
      "nyron-release@2026-01-03@00-00-00.000",
    )
  })

  it("warns when invalid nyron-release-like tags are present", async () => {
    mockGetInvalidNyronReleaseTags.mockResolvedValueOnce(["nyron-release@0.11.0"])

    await release({ dryRun: true })

    expect(mockConsoleWarn).toHaveBeenCalledWith(
      "⚠️  Ignoring 1 invalid nyron-release@* tag(s): nyron-release@0.11.0",
    )
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      "   → Expected format: nyron-release@YYYY-MM-DD@HH-MM-SS.mmm",
    )
  })
})
