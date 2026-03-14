/**
 * @fileoverview Type definitions and validation schemas for project metadata.
 * 
 * This module defines the data structures used to store and validate high-level
 * project metadata within the Nyron ecosystem, including package definitions
 * and release information.
 */

import { type } from "arktype"

/**
 * Schema for validating individual project/package objects.
 * 
 * Each project entry contains basic identification and version information
 * for packages managed by Nyron.
 * 
 * @typedef {Object} ProjectType
 * @property {string} prefix - The package name/prefix identifier
 * @property {string} version - The current semantic version string (e.g., "1.0.0")
 */
const projectType = type({
    prefix: "string",
    version: "string",
})

/**
 * Schema for validating the complete meta file structure.
 * 
 * The meta file contains high-level project metadata including all package
 * definitions, creation timestamp, and latest release tag information.
 * 
 * @typedef {Object} MetaSchema
 * @property {ProjectType[]} packages - Array of project definitions with their current versions
 * @property {Date} createdAt - The date when the Nyron project was created (parsed from ISO string)
 * @property {string | undefined} latestTag - The latest release tag (matches pattern /^nyron-release@/) or undefined
 */
export const MetaSchema = type({
    "$schema?": "string",
    packages: projectType.array(),
    createdAt: type("string").pipe((s) => new Date(s)),
    "latestTag?": "(/^nyron-release@/ | undefined)", // Latest tag, if it exists
})

/**
 * TypeScript type for the complete meta structure, inferred from MetaSchema.
 * 
 * @typedef {import("arktype").Infer<typeof MetaSchema>} Meta
 */
export type Meta = typeof MetaSchema.infer