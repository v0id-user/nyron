import { afterEach, beforeAll, describe, expect, it } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { createNyronDirectory } from "../../src/nyron/creator"
import { writeMeta } from "../../src/nyron/meta/writer"
import { writeVersionsRaw } from "../../src/nyron/versions/writer"

let getUpdatedVersions: typeof import("../../src/nyron/version").getUpdatedVersions
const originalCwd = process.cwd()
let tempDir: string | null = null

beforeAll(async () => {
  ;({ getUpdatedVersions } = await import("../../src/nyron/version"))
})

describe("getUpdatedVersions", () => {
  afterEach(async () => {
    process.chdir(originalCwd)

    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
      tempDir = null
    }
  })

  it("returns previous-to-current version transitions", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "nyron-changelog-test-"))
    await writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.2.4" }, null, 2),
    )
    process.chdir(tempDir)
    await createNyronDirectory()
    await writeMeta({
      packages: [{ prefix: "cli", version: "1.2.4" }],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    await writeVersionsRaw({
      createdAt: "2026-01-01T00:00:00.000Z",
      packages: {
        cli: [
          { prefix: "cli", version: "1.2.3" },
          { prefix: "cli", version: "1.2.4" },
        ],
      },
    })

    await expect(getUpdatedVersions()).resolves.toEqual([
      "cli@1.2.3 -> cli@1.2.4",
    ])
  })

  it("skips packages without a previous version", async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "nyron-changelog-test-"))
    await writeFile(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.2.4" }, null, 2),
    )
    process.chdir(tempDir)
    await createNyronDirectory()
    await writeMeta({
      packages: [{ prefix: "cli", version: "1.2.4" }],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })
    await writeVersionsRaw({
      createdAt: "2026-01-01T00:00:00.000Z",
      packages: {
        cli: [{ prefix: "cli", version: "1.2.4" }],
      },
    })

    await expect(getUpdatedVersions()).resolves.toEqual([])
  })
})