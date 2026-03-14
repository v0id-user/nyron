/**
 * @fileoverview Configuration for the versions file system.
 * 
 * This module defines the file path and structure for storing version information
 * for packages managed by Nyron. The versions file contains a mapping of package
 * prefixes to their version histories.
 */

/**
 * The root path where the versions file is stored relative to the project root.
 * 
 * This file contains a JSON structure with package version information,
 * including version history and metadata for each package prefix.
 * 
 * @constant {string}
 */
export const VERSIONS_ROOT_PATH = ".nyron/versions.json"

/**
 * Local JSON Schema file written alongside `.nyron/versions.json`.
 */
export const VERSIONS_SCHEMA_ROOT_PATH = ".nyron/versions.schema.json"

/**
 * `$schema` reference stored inside `.nyron/versions.json`.
 */
export const VERSIONS_SCHEMA_REF = "./versions.schema.json"
