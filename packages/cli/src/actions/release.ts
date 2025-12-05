/**
 * # Nyron Release System
 * 
 * ## Overview
 * The release command creates GitHub releases with auto-generated changelogs based on commits
 * between Nyron release tags.
 * 
 * ## Mental Model
 * ```
 * nyron-release@date1 ---- A ---- B ---- C ---- nyron-release@date2 ---- D ---- E ---- HEAD
 *                          └──────┬──────┘                                └─────┬─────┘
 *                          commits for date2 release                    commits since date2
 * ```
 * 
 * ## How It Works
 * 
 * ### Two Modes:
 * 
 * **Mode 1: New Tag Release (with -n flag)**
 * - Used when a nyron-release tag was just created and pushed
 * - Finds the latest tag (the one just pushed) and the previous tag
 * - Gets commits BETWEEN these two tags
 * - Creates GitHub release for the pushed tag
 * 
 * **Mode 2: Standard Release (without -n flag)**
 * - Used for creating a release from existing state
 * - Finds the latest tag and gets commits from that tag to HEAD
 * - Creates GitHub release for the latest tag
 * 
 * ### 1. Tag Discovery
 * - **With -n**: Finds latest tag (just pushed) and previous tag
 * - **Without -n**: Finds the latest `nyron-release@<timestamp>` tag
 * 
 * ### 2. Commit Extraction
 * - **With -n**: Fetches commits BETWEEN previous and latest tag using GitHub API
 * - **Without -n**: Fetches commits from latest tag to HEAD
 * - If no commits found, throws an error (cannot create release without commits)
 * 
 * ### 3. Commit Parsing
 * - Parses commit messages using conventional commit format (feat:, fix:, etc.)
 * - Groups commits by type (features, fixes, breaking changes, etc.)
 * - Extracts package scopes from commit messages (e.g., `feat(cli): add feature`)
 * 
 * ### 4. Version Detection
 * - Reads version information from meta.json (generated during tag/bump)
 * - Contains package names, old versions, and new versions
 * - Used to show which packages were updated and by how much
 * 
 * ### 5. Changelog Generation
 * - Generates markdown changelog from parsed commits and version data
 * - Formats into sections: Breaking Changes, Features, Bug Fixes, etc.
 * - Includes package version updates and commit details
 * 
 * ### 6. GitHub Release Creation
 * - Creates a GitHub release with the generated changelog as body
 * - Uses the determined release tag (pushed tag with -n, latest tag without)
 * - Publishes to the repository's releases page
 * 
 * ## Dry Run vs Wet Run
 * - **Dry Run**: Generates changelog and prints to console (no GitHub release created)
 * - **Wet Run**: Generates changelog and creates actual GitHub release
 */

import { loadConfig } from "../config"
import { parseCommits } from "../core/commits-parser"
import { getLatestNyronReleaseTag, getPreviousLatestNyronReleaseTag } from "../git/tags"
import { getCommitsSince, getCommitsBetween } from "../github/commits"
import type { ReleaseOptions } from "./types"
import { generateChangelogMarkdown } from "../changelog/generateChangelog"
import { getUpdatedVersions } from "../nyron/version"
import { createRelease } from "../github/release"
import { pushNyronReleaseTag } from "../github/tags"
import { setMetaLatestTag } from "../nyron/meta/writer"

/**
 * Creates a GitHub release with an auto-generated changelog.
 * 
 * @param options - Release configuration options
 * @param options.dryRun - If true, prints changelog without creating release
 * 
 * @returns Promise<void> - Returns void on success
 * 
 * @throws {Error} If no nyron release tag found or if no commits are found
 * 
 * @example
 * ```ts
 * // Create a real release
 * await release({ dryRun: false })
 * 
 * // Preview changelog without releasing
 * await release({ dryRun: true })
 * ```
 */
export const release = async (options: ReleaseOptions) => {
    const { dryRun } = options
    
    console.log(`\n🚀 Starting release process (${dryRun ? 'DRY RUN' : 'WET RUN'})...`)
    
    const { config } = await loadConfig()
    console.log(`✓ Config loaded for repo: ${config.repo}`)
    
    // Step 1: Determine which tags to use for the release
    console.log('\n📍 Step 1: Looking for release tags...')
    let fromTag: string | null = null
    let releaseTag: string | null = null
    
    if (options.newTag) {
      console.log(`[nyron] -> Creating release for newly pushed tag`)
      // Get the latest tag (the one just pushed)
      releaseTag = await getLatestNyronReleaseTag()
      if (!releaseTag) {
        throw new Error(`No nyron release tag found\n   → Make sure to push the tag with nyron tool`)
      }
      console.log(`✓ Release tag: ${releaseTag}`)
      
      // Get the previous tag to compare against
      fromTag = await getPreviousLatestNyronReleaseTag()
      if (!fromTag) {
        throw new Error(`No previous nyron release tag found\n   → Cannot create release for first tag`)
      }
      console.log(`✓ Previous tag: ${fromTag}`)
    } else {
      console.log('[nyron] -> Using the latest existing release tag')
      fromTag = await getLatestNyronReleaseTag()
      if (!fromTag) {
        throw new Error(`No nyron release tag found\n   → Make sure to push the tag with nyron tool`)
      }
      releaseTag = fromTag
      console.log(`✓ Found tag: ${fromTag}`)
    }

    // Step 2: Get commits between tags
    console.log('\n📍 Step 2: Fetching commits...')
    const commits = options.newTag 
      ? await getCommitsBetween(fromTag!, releaseTag!, config.repo)
      : await getCommitsSince(fromTag, config.repo)
    if (commits.length === 0) {
      const tagRange = options.newTag 
        ? `between ${fromTag} and ${releaseTag}`
        : `since ${fromTag}`
      throw new Error(`No commits found ${tagRange}\n   → Cannot create a release without commits`)
    }
    console.log(`✓ Found ${commits.length} commit(s)`)
  
    // Step 3: Parse commits into structured groups
    console.log('\n📍 Step 3: Parsing commits...')
    const parsedCommits = parseCommits(commits)
    console.log(`✓ Parsed commits into groups (features, fixes, etc.)`)

    // Step 4: Extract versions from meta.json
    console.log('\n📍 Step 4: Reading version information...')
    const versions = await getUpdatedVersions()
    console.log(`✓ Loaded version data for ${versions.length} package(s)`)

    // Step 5: Generate changelog
    console.log('\n📍 Step 5: Generating changelog...')
    const changelog = await generateChangelogMarkdown(parsedCommits, versions)
    console.log(`✓ Changelog generated (${changelog.length} characters)`)

    // Step 6: Publish or preview
    if (dryRun) {
      console.log('\n📍 Step 6: Preview (DRY RUN - no release created)')
      console.log(`   Release would be published with tag: ${releaseTag}`)
      console.log('\n' + '='.repeat(80))
      console.log(changelog)
      console.log('='.repeat(80) + '\n')
      console.log('✅ Dry run completed - no release was created\n')
      return
    } else {
      console.log('\n📍 Step 6: Creating GitHub release...')
      await createRelease(config.repo, releaseTag!, changelog)
      console.log(`✅ Release created successfully!\n`)

      console.log('\n📍 Step 7: Create the new tag for the next release...')
      const { tag } = await pushNyronReleaseTag(config.repo)
      // Update meta.json with the new tag
      await setMetaLatestTag(tag)
      console.log(`✅ Release created successfully!\n`)
      return
    }
}