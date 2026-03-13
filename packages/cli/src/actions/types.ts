import type { OptionValues } from "commander"
import type { BumpType } from "../core/types"

/**
 * Command-line options for the bump action.
 * Used to specify how a configured project's version should be incremented.
 */
export interface BumpOptions extends OptionValues {
    /** The type of version bump to perform (major, minor, patch) */
    type: BumpType
    /** The configured project id/key to bump (e.g., "cli" or "api") */
    project?: string
}

/**
 * Command-line options for the init action.
 * Used to create the initial nyron.config.ts configuration file.
 */
export interface InitOptions extends OptionValues {
    /** Whether to overwrite an existing configuration file */
    force?: boolean
}

// -----------------------------
// Result interfaces returned by actions
// -----------------------------

/**
 * Result returned by the bump action.
 * Contains information about the version bump operation and any generated artifacts.
 */
export interface BumpResult {
    /** Whether the bump operation completed successfully */
    success: boolean
    /** The project id that was bumped */
    project: string
    /** The new version that was created (e.g., "1.2.4") */
    newVersion?: string
}

/**
 * Result returned by the init action.
 * Contains information about the configuration file creation.
 */
export interface InitResult {
    /** Whether a new configuration file was created */
    created: boolean
    /** Full path to the configuration file */
    filepath: string
    /** Whether an existing file was overwritten */
    overwritten: boolean
}

export interface ReleaseOptions extends OptionValues {
    dryRun?: boolean
    useExistingTag?: boolean
}