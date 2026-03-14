import path from "path"
import { CHANGELOG_ROOT_PATH } from "./changelog/file-parser"
import { META_ROOT_PATH, META_SCHEMA_ROOT_PATH } from "./meta/file-parser"
import { VERSIONS_ROOT_PATH, VERSIONS_SCHEMA_ROOT_PATH } from "./versions/file-parser"
import { fileExists, folderExists } from "../core/files"
import { mkdir } from "fs/promises"
import { initMeta } from "./meta/writer"
import { initVersions } from "./versions/writer"
import { writeNyronStateSchemas } from "./schema-files"

/**
 * Initializes the Nyron workspace by creating the required directory structure and metadata files.
 *
 * Structure created:
 *   - .nyron/
 *     - changelog/
 *     - meta.json
 *     - meta.schema.json
 *     - versions.json
 *     - versions.schema.json
 *
 * This function will create missing directories/files if they do not exist yet.
 * Repeated calls will not throw if files/directories already exist.
 *
 * @example
 * createNyronDirectory()
 */
export async function createNyronDirectory(): Promise<void> {
    const cwd = process.cwd();
    const nyronDir = path.resolve(cwd, ".nyron");
    const changelogDir = path.resolve(cwd, CHANGELOG_ROOT_PATH);
    const metaFile = path.resolve(cwd, META_ROOT_PATH);
    const metaSchemaFile = path.resolve(cwd, META_SCHEMA_ROOT_PATH);
    const versionsFile = path.resolve(cwd, VERSIONS_ROOT_PATH);
    const versionsSchemaFile = path.resolve(cwd, VERSIONS_SCHEMA_ROOT_PATH);

    // Guard: check if everything already exists
    let ready = true;
    try {
        // .nyron directory
        if (!await folderExists(nyronDir)) ready = false;
        // changelog directory
        if (!await folderExists(changelogDir)) ready = false;
        // meta.json file
        if (!await fileExists(metaFile)) ready = false;
        if (!await fileExists(metaSchemaFile)) ready = false;
        // versions.json file
        if (!await fileExists(versionsFile)) ready = false;
        if (!await fileExists(versionsSchemaFile)) ready = false;
    } catch {
        ready = false;
    }
    if (ready) {
        // Everything is already set up, nothing to do
        return;
    }

    // Create all directories if missing
    if (!await folderExists(nyronDir)) {
        await mkdir(nyronDir, { recursive: true });
    }
    if (!await folderExists(changelogDir)) {
        await mkdir(changelogDir, { recursive: true });
    }

    await writeNyronStateSchemas()

    // Initialize metadata files if they do not exist yet.
    if (!await fileExists(metaFile)) {
        await initMeta()
    }
    if (!await fileExists(versionsFile)) {
        await initVersions()
    }
}