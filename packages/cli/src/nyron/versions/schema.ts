/**
 * @fileoverview Type definitions and validation schemas for package version management.
 * 
 * This module defines the data structures used to store and validate package
 * version information within the Nyron ecosystem.
 */

import { type } from "arktype"

/**
 * Schema for validating package information.
 * 
 * Each package entry contains metadata about a specific package version,
 * including its prefix, version number, and publication status.
 * 
 * @typedef {Object} PackageInfoSchema
 * @property {string} prefix - The package prefix/identifier
 * @property {string} version - The semantic version string (e.g., "1.0.0")
 * @property {Date | undefined} lastPublished - The date when this version was last published, if any (parsed from ISO string). Optional field.
 */
export const PackageInfoSchema = type({
    prefix: "string",
    version: "string",
    "lastPublished?": type("string | undefined").pipe((s) => s ? new Date(s) : undefined)
})

/**
 * Schema for validating the complete versions file structure.
 * 
 * The versions file contains metadata about when it was created and
 * a mapping of package prefixes to their version histories.
 * 
 * @typedef {Object} VersionsSchema
 * @property {string} createdAt - ISO timestamp of when the versions file was created
 * @property {Object.<string, PackageInfo[]>} packages - Mapping of package prefixes to their version history arrays
 */
export const VersionsSchema = type({
    "$schema?": "string",
    createdAt: "string",
    packages: {
        "[string]": PackageInfoSchema.array()
    } 
})

/**
 * TypeScript type for package information, inferred from PackageInfoSchema.
 * 
 * @typedef {import("arktype").Infer<typeof PackageInfoSchema>} PackageInfo
 */
export type PackageInfo = typeof PackageInfoSchema.infer

/**
 * TypeScript type for the complete versions structure, inferred from VersionsSchema.
 * 
 * @typedef {import("arktype").Infer<typeof VersionsSchema>} Versions
 */
export type Versions = typeof VersionsSchema.infer