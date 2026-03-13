import { afterEach, describe, expect, it } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { createNyronDirectory } from "../../src/nyron/creator"

let originalCwd = process.cwd()
let tempDir: string | null = null

describe("createNyronDirectory", () => {
    afterEach(async () => {
        process.chdir(originalCwd)

        if (tempDir) {
            await rm(tempDir, { recursive: true, force: true })
            tempDir = null
        }
    })

    it("should create the nyron directory", async () => {
        tempDir = await mkdtemp(path.join(tmpdir(), "nyron-creator-"))
        await writeFile(path.join(tempDir, "package.json"), JSON.stringify({
            name: "fixture",
            version: "1.0.0",
        }))
        process.chdir(tempDir)

        await createNyronDirectory()

        expect(Bun.file(path.join(tempDir, ".nyron/meta.json"))).toBeDefined()
        expect(await Bun.file(path.join(tempDir, ".nyron/meta.json")).text()).toContain("\"packages\": []")
        expect(await Bun.file(path.join(tempDir, ".nyron/versions.json")).text()).toContain("\"packages\": {}")
    })
})