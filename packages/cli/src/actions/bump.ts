/**
 * ------------------------------------------------------------
 * Nyron: Version bumping action
 * ------------------------------------------------------------
 * This module provides a simplified version bumping workflow that:
 * 1. Takes a package prefix and bump type (major, minor, patch, etc.)
 * 2. Delegates to syncincrementVersion() to handle the actual version bump
 * 3. Updates both the meta version system and versions tracking
 * 4. Returns a standardized result indicating success/failure
 *
 * The heavy lifting is handled by the sync module, which coordinates
 * between the meta version system and versions file system to ensure
 * consistency across the monorepo.
 * ------------------------------------------------------------
 */

import type { BumpOptions, BumpResult } from "./types";
import { syncincrementVersion } from "../nyron/versions/sync";
import { loadConfig } from "../config/loader";
import { readMeta } from "../nyron/meta/reader";
import { writePackageVersion } from "../package/write";
import { resolve } from "path";
import { CliError } from "../core/errors";

function resolveProjectId(
  requestedProject: string | undefined,
  projectIds: string[],
): string {
  if (requestedProject) {
    if (!projectIds.includes(requestedProject)) {
      throw new CliError(`Unknown project "${requestedProject}"`, {
        details: [
          `Configured projects: ${projectIds.join(", ")}`,
          "Use the project key from nyron.config.ts.",
        ],
      })
    }

    return requestedProject
  }

  if (projectIds.length === 1 && projectIds[0]) {
    return projectIds[0]
  }

  throw new CliError("Project selection is required", {
    details: [
      "This config contains multiple projects.",
      `Choose one with --project <id>: ${projectIds.join(", ")}`,
    ],
  })
}

export const bump = async (options: BumpOptions): Promise<BumpResult> => {
  try {
     const { config } = await loadConfig()
     const projectId = resolveProjectId(options.project, Object.keys(config.projects))
     const projectConfig = config.projects[projectId]

     if (!projectConfig) {
       throw new CliError(`Project "${projectId}" not found in config`)
     }

     // Bump the version in meta and versions tracking
     await syncincrementVersion(projectId, options.type)

     // Read the updated meta to get the new version
     const meta = await readMeta()
     const metaPackage = meta.packages.find(p => p.prefix === projectId)

     if (!metaPackage) {
       throw new CliError(`Project "${projectId}" not found in Nyron metadata`)
     }

     // Update the package.json with the new version
     const fullPath = resolve(process.cwd(), projectConfig.path)
     writePackageVersion(fullPath, metaPackage.version)

     console.log(`✅ Bumped ${projectId} to ${metaPackage.version}`)

     return {
      success: true,
      project: projectId,
      newVersion: metaPackage.version,
     }
  } catch (error) {
    if (error instanceof CliError) {
      throw error
    }

    throw new CliError("Bump failed", {
      details: [error instanceof Error ? error.message : String(error)],
      cause: error,
    })
  }
}