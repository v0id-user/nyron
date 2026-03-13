/**
 * @fileoverview Writer functions for the meta file system.
 * 
 * This module provides functionality to write and update the meta file,
 * maintaining high-level project metadata and package version information.
 */

import path from "path"
import type { Meta } from "./schema"
import { writeFile } from "../../core/files"
import { META_ROOT_PATH } from "./file-parser"
import { readMeta } from "./reader"
import { bumpVersion } from "../../core/semver"
import type { BumpType } from "../../core/types"

/**
 * Writes meta data to the meta file.
 * 
 * This function serializes the provided meta data to JSON and writes it
 * to the meta file (`.nyron/meta.json`).
 * 
 * @async
 * @function writeMeta
 * @param {Meta} meta - The meta data object to write to the file
 * @returns {Promise<void>} A promise that resolves when the file has been written
 * @throws {Error} If the file cannot be written
 * 
 * @example
 * ```typescript
 * const meta = {
 *   packages: [{ prefix: "my-package", version: "1.0.0" }],
 *   createdAt: new Date(),
 *   latestTag: generateNyronReleaseTag()
 * }
 * await writeMeta(meta)
 * ```
 */
export async function writeMeta(meta: Meta) {
    const metaPath = path.join(process.cwd(), META_ROOT_PATH)
    await writeFile(metaPath, JSON.stringify(meta, null, 2))
}

/**
 * Initializes the meta file with default values.
 * 
 * This function writes the default meta data to the meta file (`.nyron/meta.json`).
 * 
 * @async
 * @function initMeta
 * @returns {Promise<void>} A promise that resolves when the file has been written
 * @throws {Error} If the file cannot be written
 */
export async function initMeta() {
    const metaPath = path.join(process.cwd(), META_ROOT_PATH)
    await writeFile(metaPath, JSON.stringify({
        packages: [],
        createdAt: new Date(),
        latestTag: undefined
    }, null, 2))
}

/**
 * Bumps the version of a specific package prefix in the meta file.
 * 
 * This function reads the current meta data, finds the package with the specified
 * prefix, bumps its version according to the bump type, and writes the updated
 * meta data back to the file.
 * 
 * @async
 * @function bumpMetaVersionOfPrefix
 * @param {string} prefix - The package prefix/identifier to bump the version for
 * @param {BumpType} type - The type of version bump to perform (major, minor, patch, etc.)
 * @returns {Promise<string>} A promise that resolves to the new version string
 * @throws {Error} If the package with the specified prefix is not found
 * @throws {Error} If the meta file cannot be read or written
 * 
 * @example
 * ```typescript
 * // Bump patch version for a package
 * const newVersion = await bumpMetaVersionOfPrefix("my-package", "patch")
 * console.log(newVersion) // "1.0.1"
 * 
 * // Bump major version for a package
 * const newVersion = await bumpMetaVersionOfPrefix("my-package", "major")
 * console.log(newVersion) // "2.0.0"
 * ```
 */
export async function bumpMetaVersionOfPrefix(prefix: string, type: BumpType): Promise<string> {
    const meta = await readMeta()
    const project = meta.packages.find(p => p.prefix === prefix)
    if (!project) {
        throw new Error(`Project with prefix ${prefix} not found`)
    }
    const newPackages = meta.packages.map(p =>
        p.prefix === prefix
            ? { ...p, version: bumpVersion(p.version, type) }
            : p
    ) as typeof meta.packages
    const newMeta: Meta = { ...meta, packages: newPackages }
    await writeMeta(newMeta)
    return newMeta.packages.find(p => p.prefix === prefix)?.version as string
}

/**
 * Updates the latest release tag in the meta file.
 * 
 * This function reads the current meta data, updates the latestTag field
 * with the provided tag, and writes the updated meta data back to the file.
 * 
 * @async
 * @function setMetaLatestTag
 * @param {string} tag - The latest release tag to set (should match pattern /^nyron-release@/)
 * @returns {Promise<void>} A promise that resolves when the file has been written
 * @throws {Error} If the meta file cannot be read or written
 * 
 * @example
 * ```typescript
 * await setMetaLatestTag("nyron-release@1.2.3")
 * ```
 */
export async function setMetaLatestTag(tag: string) {
    const meta = await readMeta()
    const newMeta: Meta = { ...meta, latestTag: tag }
    await writeMeta(newMeta)
}

/**
 * Updates the project creation date in the meta file.
 * 
 * This function reads the current meta data, updates the createdAt field
 * with the provided date, and writes the updated meta data back to the file.
 * 
 * @async
 * @function setMetaCreatedAt
 * @param {Date} createdAt - The project creation date to set
 * @returns {Promise<void>} A promise that resolves when the file has been written
 * @throws {Error} If the meta file cannot be read or written
 * 
 * @example
 * ```typescript
 * await setMetaCreatedAt(new Date("2024-01-01T00:00:00Z"))
 * ```
 */
export async function setMetaCreatedAt(createdAt: Date) {
    const meta = await readMeta()
    const newMeta: Meta = { ...meta, createdAt }
    await writeMeta(newMeta)
}

/**
 * Adds a new package to the meta file.
 * 
 * This function reads the current meta data, adds a new package with the specified
 * prefix and version to the packages array, and writes the updated meta data back to the file.
 * 
 * @async
 * @function addMetaPackage
 * @param {string} prefix - The package prefix/identifier to add
 * @param {string} version - The initial version for the package
 * @returns {Promise<void>} A promise that resolves when the file has been written
 * @throws {Error} If the meta file cannot be read or written
 * 
 * @example
 * ```typescript
 * await addMetaPackage("my-new-package", "1.0.0")
 * ```
 */
export async function addMetaPackage(prefix: string, version: string) {
    const meta = await readMeta()
    const newPackages = [...meta.packages, { prefix, version }]
    const newMeta: Meta = { ...meta, packages: newPackages as typeof meta.packages }
    await writeMeta(newMeta)
}

/**
 * Removes a package from the meta file.
 * 
 * This function reads the current meta data, filters out the package with the specified
 * prefix from the packages array, and writes the updated meta data back to the file.
 * 
 * @async
 * @function removeMetaPackage
 * @param {string} prefix - The package prefix/identifier to remove
 * @returns {Promise<void>} A promise that resolves when the file has been written
 * @throws {Error} If the meta file cannot be read or written
 * 
 * @example
 * ```typescript
 * await removeMetaPackage("old-package")
 * ```
 */
export async function removeMetaPackage(prefix: string) {
    const meta = await readMeta()
    const newPackages = meta.packages.filter(p => p.prefix !== prefix)
    const newMeta: Meta = { ...meta, packages: newPackages }
    await writeMeta(newMeta)
}

/**
 * Updates the version of a package in the meta file.
 * 
 * This function reads the current meta data, updates the version of the package
 * with the specified prefix, and writes the updated meta data back to the file.
 * 
 * @async
 * @function updateMetaPackageVersion
 * @param {string} prefix - The package prefix/identifier to update
 * @param {string} version - The new version for the package
 * @returns {Promise<void>} A promise that resolves when the file has been written
 * @throws {Error} If the package with the specified prefix is not found
 * @throws {Error} If the meta file cannot be read or written
 * 
 * @example
 * ```typescript
 * await updateMetaPackageVersion("my-package", "1.2.3")
 * ```
 */
export async function updateMetaPackageVersion(prefix: string, version: string) {
    const meta = await readMeta()
    const project = meta.packages.find(p => p.prefix === prefix)
    if (!project) {
        throw new Error(`Project with prefix ${prefix} not found`)
    }
    const newPackages = meta.packages.map(p =>
        p.prefix === prefix ? { ...p, version } : p
    ) as typeof meta.packages
    const newMeta: Meta = { ...meta, packages: newPackages }
    await writeMeta(newMeta)
}