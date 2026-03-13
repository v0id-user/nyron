import { resolve } from "node:path"
import type { NyronConfig } from "../config/types"
import { createNyronDirectory } from "./creator"
import { readMeta } from "./meta/reader"
import { writeMeta } from "./meta/writer"
import type { Meta } from "./meta/schema"
import { readVersions } from "./versions/reader"
import { writeVersionsRaw } from "./versions/writer"
import type { PackageInfo, Versions } from "./versions/schema"
import { getLatestNyronReleaseTag } from "../git/tags"
import { getPackageVersion, validatePackageJson } from "../package/read"

export interface SyncNyronStateResult {
  meta: Meta
  versions: Versions
}

function resolveProjectVersion(projectPath: string): string {
  const fullPath = resolve(process.cwd(), projectPath)
  if (!validatePackageJson(fullPath)) {
    return "0.0.0"
  }

  return getPackageVersion(fullPath) ?? "0.0.0"
}

function upsertVersionHistory(
  history: PackageInfo[] | undefined,
  prefix: string,
  version: string,
): PackageInfo[] {
  const nextHistory = [...(history ?? [])]
  const latestEntry = nextHistory.at(-1)

  if (!latestEntry || latestEntry.version !== version) {
    nextHistory.push({
      prefix,
      version,
      lastPublished: latestEntry?.lastPublished,
    })
  }

  return nextHistory
}

export async function syncNyronState(
  config: NyronConfig,
): Promise<SyncNyronStateResult> {
  await createNyronDirectory()

  const [meta, versions, latestGitTag] = await Promise.all([
    readMeta(),
    readVersions(),
    getLatestNyronReleaseTag().catch(() => null),
  ])

  const nextMetaPackages = Object.entries(config.projects).map(
    ([projectId, projectConfig]) => ({
      prefix: projectId,
      version: resolveProjectVersion(projectConfig.path),
    }),
  )

  const nextVersionsPackages = Object.fromEntries(
    Object.entries(config.projects).map(([projectId, projectConfig]) => {
      const version = resolveProjectVersion(projectConfig.path)
      return [
        projectId,
        upsertVersionHistory(versions.packages[projectId], projectId, version),
      ]
    }),
  )

  const nextMeta: Meta = {
    packages: nextMetaPackages,
    createdAt: meta.createdAt,
    latestTag: latestGitTag ?? meta.latestTag,
  }

  const nextVersions: Versions = {
    createdAt: versions.createdAt,
    packages: nextVersionsPackages,
  }

  await Promise.all([writeMeta(nextMeta), writeVersionsRaw(nextVersions)])

  return {
    meta: nextMeta,
    versions: nextVersions,
  }
}
