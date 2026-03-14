import { afterEach, describe, expect, it } from "bun:test"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { CliError } from "../../src/core/errors"

const originalCwd = process.cwd()
let tempDir: string | null = null

describe("Nyron state file readers", () => {
  afterEach(async () => {
    process.chdir(originalCwd)

    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
      tempDir = null
    }
  })

  it("surfaces the expected meta.json shape when the file is malformed", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "nyron-state-reader-"))
    await mkdir(path.join(tempDir, ".nyron"), { recursive: true })
    await writeFile(
      path.join(tempDir, ".nyron/meta.json"),
      JSON.stringify(
        {
          packages: [{ name: "cli", path: "packages/cli" }],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        null,
        2,
      ),
    )

    process.chdir(tempDir)
    const { MetaSchema } = await import("../../src/nyron/meta/schema")
    const { readStateFile } = await import("../../src/nyron/state-file")

    try {
      await readStateFile({
        label: "meta",
        rootPath: ".nyron/meta.json",
        expectedShape:
          '{"$schema":"./meta.schema.json","packages":[{"prefix":"cli","version":"1.2.3"}],"createdAt":"2026-01-01T00:00:00.000Z"}',
        schema: MetaSchema,
      })
      throw new Error("Expected readStateFile() to throw")
    } catch (error) {
      expect(error).toBeInstanceOf(CliError)
      expect((error as CliError).message).toBe("Invalid meta state file")
      expect((error as CliError).details).toContain(
        "Observed packages[0] keys: name, path",
      )
    }
  })

  it("surfaces JSON parse errors for versions.json", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "nyron-state-reader-"))
    await mkdir(path.join(tempDir, ".nyron"), { recursive: true })
    await writeFile(path.join(tempDir, ".nyron/versions.json"), "{ invalid json")

    process.chdir(tempDir)
    const { VersionsSchema } = await import("../../src/nyron/versions/schema")
    const { readStateFile } = await import("../../src/nyron/state-file")

    try {
      await readStateFile({
        label: "versions",
        rootPath: ".nyron/versions.json",
        expectedShape:
          '{"$schema":"./versions.schema.json","createdAt":"2026-01-01T00:00:00.000Z","packages":{"cli":[{"prefix":"cli","version":"1.2.3"}]}}',
        schema: VersionsSchema,
      })
      throw new Error("Expected readStateFile() to throw")
    } catch (error) {
      expect(error).toBeInstanceOf(CliError)
      expect((error as CliError).message).toBe("Invalid versions JSON")
      expect((error as CliError).details[1]).toContain('"$schema":"./versions.schema.json"')
    }
  })
})
