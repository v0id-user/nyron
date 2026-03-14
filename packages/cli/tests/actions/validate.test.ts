import { afterEach, beforeAll, beforeEach, describe, expect, it, spyOn } from "bun:test"
import { mkdtemp, rm, unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { createNyronDirectory } from "../../src/nyron/creator"

let validate: typeof import("../../src/actions/validate").validate
const mockConsoleLog = spyOn(console, "log").mockImplementation(() => {})
const originalCwd = process.cwd()
let tempDir: string | null = null

beforeAll(async () => {
  ;({ validate } = await import("../../src/actions/validate"))
})

describe("validate", () => {
  afterEach(async () => {
    process.chdir(originalCwd)

    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
      tempDir = null
    }
  })

  beforeEach(() => {
    mockConsoleLog.mockClear()
  })

  it("prints a success summary for valid state files", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "nyron-validate-"))
    await writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.2.3" }, null, 2),
    )
    process.chdir(tempDir)
    await createNyronDirectory()

    await validate()

    expect(mockConsoleLog).toHaveBeenCalledWith(
      "✓ .nyron/meta.json is valid (0 package(s))",
    )
    expect(mockConsoleLog).toHaveBeenCalledWith(
      "✓ .nyron/versions.json is valid (0 project history bucket(s))",
    )
  })

  it("fails when the local JSON schema files are missing", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "nyron-validate-"))
    await writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.2.3" }, null, 2),
    )
    process.chdir(tempDir)
    await createNyronDirectory()
    await unlink(path.join(tempDir, ".nyron/meta.schema.json"))

    await expect(validate()).rejects.toThrow("Missing Nyron state schema files")
  })
})
