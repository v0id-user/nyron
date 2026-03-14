/**
 * @fileoverview Writer functions for the versions file system.
 * 
 * This module provides functionality to write and update the versions file,
 * maintaining package version history and metadata.
 */

import path from "path"
import { writeFile } from "../../core/files"
import { readVersions } from "./reader"
import { VERSIONS_ROOT_PATH, VERSIONS_SCHEMA_REF } from "./file-parser"
import type { PackageInfo } from "./schema"

function withVersionsSchema(versions: import("./schema").Versions) {
    return {
        ...versions,
        $schema: VERSIONS_SCHEMA_REF,
    }
}

/**
 * Writes a new package version entry to the versions file.
 * 
 * This function reads the current versions file, adds a new package version entry
 * for the specified prefix, and writes the updated data back to the file.
 * If the prefix doesn't exist in the versions file, it will be initialized as
 * an empty array before adding the new entry.
 * 
 * @async
 * @function writeVersions
 * @param {string} prefix - The package prefix/identifier to add version info for
 * @param {PackageInfo} packageInfo - The package version information to store
 * @returns {Promise<void>} A promise that resolves when the file has been written
 * @throws {Error} If the versions file cannot be read or written
 * 
 * @example
 * ```typescript
 * const packageInfo = {
 *   prefix: "my-package",
 *   version: "1.2.3",
 *   lastPublished: new Date()
 * }
 * await writeVersions("my-package", packageInfo)
 * ```
 */
export async function writeVersions(prefix: string, packageInfo: PackageInfo) {
    const versions = await readVersions()
    
    // Initialize the prefix array if it doesn't exist
    if (!versions.packages[prefix]) {
        versions.packages[prefix] = []
    }
    
    // Add the new package info to the array
    versions.packages[prefix].push(packageInfo)
    
    // Write back to file
    const versionsPath = path.join(process.cwd(), VERSIONS_ROOT_PATH)
    await writeFile(versionsPath, JSON.stringify(withVersionsSchema(versions), null, 2))
}

/**
 * Initializes the versions file with default values.
 * 
 * This function writes the default versions data to the versions file (`.nyron/versions.json`).
 * 
 * @async
 * @function initVersions
 * @returns {Promise<void>} A promise that resolves when the file has been written
 * @throws {Error} If the file cannot be written
 */
export async function initVersions() {
    const versionsPath = path.join(process.cwd(), VERSIONS_ROOT_PATH)
    await writeFile(versionsPath, JSON.stringify({
        $schema: VERSIONS_SCHEMA_REF,
        createdAt: new Date(),
        packages: {}
    }, null, 2))
}

/**
 * Writes the entire versions object to the versions file.
 * 
 * This function takes a complete versions object and writes it to the versions file,
 * replacing all existing content.
 * 
 * @async
 * @function writeVersionsRaw
 * @param {import("./schema").Versions} versions - The complete versions object to write
 * @returns {Promise<void>} A promise that resolves when the file has been written
 * @throws {Error} If the versions file cannot be written
 * 
 * @example
 * ```typescript
 * const versions = await readVersions()
 * // Modify versions...
 * await writeVersionsRaw(versions)
 * ```
 */
export async function writeVersionsRaw(versions: import("./schema").Versions) {
    const versionsPath = path.join(process.cwd(), VERSIONS_ROOT_PATH)
    await writeFile(versionsPath, JSON.stringify(withVersionsSchema(versions), null, 2))
}

/**
 * Adds a new package to the versions file or initializes it if it doesn't exist.
 * 
 * This function reads the current versions file, adds a new package entry for the
 * specified prefix with the given version, and writes the updated data back to the file.
 * If the prefix already exists, a new version entry is appended to its array.
 * 
 * @async
 * @function addVersionsPackage
 * @param {string} prefix - The package prefix/identifier to add
 * @param {string} version - The initial version for the package
 * @returns {Promise<void>} A promise that resolves when the file has been written
 * @throws {Error} If the versions file cannot be read or written
 * 
 * @example
 * ```typescript
 * await addVersionsPackage("my-new-package", "1.0.0")
 * ```
 */
export async function addVersionsPackage(prefix: string, version: string) {
    const versions = await readVersions()
    
    // Initialize the prefix array if it doesn't exist
    if (!versions.packages[prefix]) {
        versions.packages[prefix] = []
    }
    
    // Add the new package info to the array
    const packageInfo: PackageInfo = {
        prefix: prefix,
        version: version,
        lastPublished: undefined
    }
    versions.packages[prefix].push(packageInfo)
    
    await writeVersionsRaw(versions)
}

/**
 * Removes a package from the versions file.
 * 
 * This function reads the current versions file, removes the package with the
 * specified prefix from the packages object, and writes the updated data back to the file.
 * 
 * @async
 * @function removeVersionsPackage
 * @param {string} prefix - The package prefix/identifier to remove
 * @returns {Promise<void>} A promise that resolves when the file has been written
 * @throws {Error} If the versions file cannot be read or written
 * 
 * @example
 * ```typescript
 * await removeVersionsPackage("old-package")
 * ```
 */
export async function removeVersionsPackage(prefix: string) {
    const versions = await readVersions()
    
    // Remove the prefix from packages
    delete versions.packages[prefix]
    
    await writeVersionsRaw(versions)
}