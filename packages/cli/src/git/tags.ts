// Tag parser
// It parse prefixes and extract versions

import { simpleGit } from "simple-git"
import { NYRON_RELEASE_PREFIX, parseNyronReleaseTag } from "../core/tag-parser"

const git = simpleGit()

/**
 * Returns all local Git tag names that begin with the provided prefix.
 *
 * @param {string} prefix - Required tag prefix (e.g., "app@").
 * @returns {Promise<string[]>} Array of matching tag names.
 */
export async function getTags(prefix: string) {
  const { all } = await git.tags()
  return all.filter(t => t.startsWith(prefix))
}

async function getSortedNyronReleaseTags() {
  const tags = await getTags(`${NYRON_RELEASE_PREFIX}@`)
  return tags
    .map(tagName => ({ tag: tagName, date: parseNyronReleaseTag(tagName) }))
    .filter(entry => entry.date !== null) as { tag: string; date: Date }[]
}

export async function getInvalidNyronReleaseTags(): Promise<string[]> {
  const tags = await getTags(`${NYRON_RELEASE_PREFIX}@`)
  return tags.filter((tag) => parseNyronReleaseTag(tag) === null)
}

/**
 * Returns the latest Nyron release tag (the most recent one by date).
 * Nyron release tags use date format: nyron-release@2024-01-15@14-30-25.123
 *
 * @returns {Promise<string|null>} The latest Nyron release tag or null if none exist.
 */
export async function getLatestNyronReleaseTag(): Promise<string | null> {
  const withParsedDates = await getSortedNyronReleaseTags()

  if (withParsedDates.length === 0) return null;

  // Sort by date descending (newest first)
  withParsedDates.sort((a, b) => b.date.getTime() - a.date.getTime());
  return withParsedDates[0]!.tag;
}

/**
 * Returns the Nyron release tag *immediately before* the provided tag,
 * based on parsed date order.
 *
 * @param {string} tag - The tag to find the predecessor of.
 * @returns {Promise<string|null>} The previous release tag, or null if none found.
 */
export async function getPreviousLatestNyronReleaseTag(): Promise<string | null> {
  const latestTag = await getLatestNyronReleaseTag()
  if (!latestTag) return null
  const withParsedDates = await getSortedNyronReleaseTags()

  if (withParsedDates.length === 0) return null;

  // Sort by date descending (newest first)
  withParsedDates.sort((a, b) => b.date.getTime() - a.date.getTime());

  const idx = withParsedDates.findIndex(entry => entry.tag === latestTag);
  if (idx === -1 || idx === withParsedDates.length - 1) {
    // Tag not found or is the oldest tag (no previous)
    return null;
  }
  return withParsedDates[idx + 1]!.tag;
}


export async function getFirstCommitHash(): Promise<string> {
  try {
    const result = await git.raw(['rev-list', '--max-parents=0', 'HEAD'])
    const hash = result.trim().split('\n')[0] // Get first line if multiple roots
    if (!hash) {
      throw new Error("No commits found in repository")
    }
    return hash
  } catch (error) {
    throw new Error("No commits found in repository\n   → Make your first commit before creating tags")
  }
}

export async function getPreviousNyronReleaseTag(): Promise<string | null> {
  const tags = await getTags(NYRON_RELEASE_PREFIX)
  const previousTag = tags.at(-2)
  
  if (previousTag) {
    return previousTag
  }
  
  // No previous tag found - use first commit as baseline
  try {
    const firstCommit = await getFirstCommitHash()
    console.log("ℹ️  No previous tag found, using first commit as baseline")
    return firstCommit
  } catch (error) {
    console.error(`⚠️  ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}