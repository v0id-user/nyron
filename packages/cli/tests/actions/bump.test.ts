import { beforeAll, beforeEach, describe, expect, it, mock, spyOn } from "bun:test"

const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {})

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

const mockSyncIncrementVersion = mock(() => Promise.resolve())
const mockSyncNyronState = mock(() =>
  Promise.resolve({
    meta: {
      packages: [{ prefix: "cli", version: "1.2.3" }],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    versions: {
      createdAt: "2026-01-01T00:00:00.000Z",
      packages: { cli: [{ prefix: "cli", version: "1.2.3" }] },
    },
  }),
)
const mockReadMeta = mock(() =>
  Promise.resolve({
    packages: [{ prefix: "cli", version: "1.2.4" }],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  }),
)
const mockWritePackageVersion = mock(() => {})

mock.module("../../src/config/loader", () => ({
  loadConfig: mockLoadConfig,
}))

mock.module("../../src/nyron/versions/sync", () => ({
  syncincrementVersion: mockSyncIncrementVersion,
}))

mock.module("../../src/nyron/meta/reader", () => ({
  readMeta: mockReadMeta,
}))

mock.module("../../src/package/write", () => ({
  writePackageVersion: mockWritePackageVersion,
}))

mock.module("../../src/nyron/state", () => ({
  syncNyronState: mockSyncNyronState,
}))

let bump: typeof import("../../src/actions/bump").bump

beforeAll(async () => {
  ;({ bump } = await import("../../src/actions/bump"))
})

describe("bump", () => {
  beforeEach(() => {
    mockConsoleLog.mockClear()
    mockLoadConfig.mockClear()
    mockSyncIncrementVersion.mockClear()
    mockSyncNyronState.mockClear()
    mockReadMeta.mockClear()
    mockWritePackageVersion.mockClear()
  })

  it("defaults to the only configured project", async () => {
    const result = await bump({ type: "patch" })

    expect(result).toEqual({
      success: true,
      project: "cli",
      newVersion: "1.2.4",
    })
    expect(mockSyncIncrementVersion).toHaveBeenCalledWith("cli", "patch")
    expect(mockSyncNyronState).toHaveBeenCalledWith({
      repo: "acme/example",
      projects: {
        cli: {
          tagPrefix: "@acme/cli@",
          path: "packages/cli",
        },
      },
    })
    expect(mockWritePackageVersion).toHaveBeenCalledWith(
      expect.stringContaining("packages/cli"),
      "1.2.4",
    )
    expect(mockConsoleLog).toHaveBeenCalledWith("✅ Bumped cli to 1.2.4")
  })

  it("uses the explicitly requested project", async () => {
    mockLoadConfig.mockResolvedValueOnce({
      config: {
        repo: "acme/example",
        projects: {
          cli: {
            tagPrefix: "@acme/cli@",
            path: "packages/cli",
          },
          api: {
            tagPrefix: "@acme/api@",
            path: "packages/api",
          },
        },
      },
      filepath: "/tmp/nyron.config.ts",
      isEmpty: false,
    })
    mockReadMeta.mockResolvedValueOnce({
      packages: [{ prefix: "api", version: "2.0.0" }],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })

    const result = await bump({ type: "minor", project: "api" })

    expect(result.project).toBe("api")
    expect(result.newVersion).toBe("2.0.0")
    expect(mockSyncIncrementVersion).toHaveBeenCalledWith("api", "minor")
  })

  it("throws when multiple projects exist and no project is selected", async () => {
    mockLoadConfig.mockResolvedValueOnce({
      config: {
        repo: "acme/example",
        projects: {
          cli: {
            tagPrefix: "@acme/cli@",
            path: "packages/cli",
          },
          api: {
            tagPrefix: "@acme/api@",
            path: "packages/api",
          },
        },
      },
      filepath: "/tmp/nyron.config.ts",
      isEmpty: false,
    })

    await expect(bump({ type: "minor" })).rejects.toThrow(
      "Project selection is required",
    )
  })
})