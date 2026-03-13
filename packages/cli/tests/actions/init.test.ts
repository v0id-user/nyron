import { describe, it, expect, mock, beforeEach, spyOn } from "bun:test"
import { init } from "../../src/actions/init"
import type { InitOptions } from "../../src/actions/types"
import type { DiscoveredProject } from "../../src/utils/discoverProjects"

// Mock console methods
const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {})

// Mock file system operations
const mockExistsSync = mock(() => false)
const mockWriteFileSync = mock(() => {})

// Mock dependencies
const mockDetectRepoSlug = mock(() => Promise.resolve("acme/example"))
const mockDiscoverProjects = mock(
  (): Promise<DiscoveredProject[]> =>
    Promise.resolve([
      {
        id: "cli",
        path: "packages/cli",
        packageName: "@acme/cli",
        version: "1.2.3",
        tagPrefix: "@acme/cli@",
      },
    ]),
)
const mockSyncNyronState = mock(() => Promise.resolve())

// Mock modules
mock.module("fs", () => ({
  existsSync: mockExistsSync,
  writeFileSync: mockWriteFileSync
}))

mock.module("../../src/utils/detectRepo", () => ({
  detectRepoSlug: mockDetectRepoSlug
}))

mock.module("../../src/utils/discoverProjects", () => ({
  discoverProjects: mockDiscoverProjects
}))

mock.module("../../src/nyron/state", () => ({
  syncNyronState: mockSyncNyronState
}))

describe("init", () => {
  beforeEach(() => {
    // Reset all mocks
    mockConsoleLog.mockClear()
    mockExistsSync.mockClear()
    mockWriteFileSync.mockClear()
    mockDetectRepoSlug.mockClear()
    mockDiscoverProjects.mockClear()
    mockSyncNyronState.mockClear()

    // Reset to default implementations
    mockExistsSync.mockReturnValue(false)
  })

  it("should create a new nyron.config.ts file when none exists", async () => {
    const options: InitOptions = {}
    
    const result = await init(options)
    
    expect(result.created).toBe(true)
    expect(result.filepath).toContain("nyron.config.ts")
    expect(result.overwritten).toBe(false)
    
    expect(mockDetectRepoSlug).toHaveBeenCalledTimes(1)
    expect(mockDiscoverProjects).toHaveBeenCalledTimes(1)
    expect(mockSyncNyronState).toHaveBeenCalledTimes(1)
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1)
    expect(mockConsoleLog).toHaveBeenCalledWith("✅ Created nyron.config.ts")
  })

  it("should not overwrite existing config file without force option", async () => {
    mockExistsSync.mockReturnValue(true)
    const options: InitOptions = {}
    
    const result = await init(options)
    
    expect(result.created).toBe(false)
    expect(result.overwritten).toBe(false)
    expect(mockConsoleLog).toHaveBeenCalledWith("⚠️  Configuration already exists: nyron.config.ts")
    expect(mockConsoleLog).toHaveBeenCalledWith("   → Use --force to overwrite")
    expect(mockWriteFileSync).not.toHaveBeenCalled()
    expect(mockSyncNyronState).not.toHaveBeenCalled()
  })

  it("should overwrite existing config file with force option", async () => {
    mockExistsSync.mockReturnValue(true)
    const options: InitOptions = { force: true }
    
    const result = await init(options)
    
    expect(result.created).toBe(true)
    expect(result.overwritten).toBe(true)
    expect(mockDetectRepoSlug).toHaveBeenCalledTimes(1)
    expect(mockSyncNyronState).toHaveBeenCalledTimes(1)
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1)
    expect(mockConsoleLog).toHaveBeenCalledWith("✅ Created nyron.config.ts")
  })

  it("should write correct config content", async () => {
    const options: InitOptions = {}
    
    await init(options)
    
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining("nyron.config.ts"),
      expect.stringContaining("import { defineConfig } from \"@nyron/cli/config\""),
      "utf-8"
    )
    
    const call = mockWriteFileSync.mock.calls[0] as any
    expect(call).toBeDefined()
    const writtenContent = call[1] as string
    expect(writtenContent).toContain("export default defineConfig")
    expect(writtenContent).toContain('repo: "acme/example"')
    expect(writtenContent).toContain('"cli"')
    expect(writtenContent).toContain('tagPrefix: "@acme/cli@"')
    expect(writtenContent).not.toContain("autoChangelog")
    expect(writtenContent).not.toContain("onPushReminder")
  })

  it("should fall back to a single main project when discovery is empty", async () => {
    mockDiscoverProjects.mockResolvedValueOnce([])

    await init({})

    expect(mockSyncNyronState).toHaveBeenCalledWith({
      repo: "acme/example",
      projects: {
        main: {
          tagPrefix: "v",
          path: ".",
        },
      },
    })
  })
})