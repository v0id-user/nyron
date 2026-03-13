import { generateNyronReleaseTag } from "../core/tag-parser"
import simpleGit from "simple-git"
import { CliError } from "../core/errors"

export async function pushNyronReleaseTag(_repo?: string) {
  const tag = generateNyronReleaseTag()
  const git = simpleGit()

  try {
    // Check if GPG signing is configured
    let shouldSign = false
    try {
      const signingKey = await git.raw(['config', 'user.signingkey'])
      const tagSign = await git.raw(['config', 'tag.gpgSign']).catch(() => '')
      shouldSign = signingKey.trim() !== '' || tagSign.trim() === 'true'
    } catch {
      // GPG not configured, will create unsigned tag
      shouldSign = false
    }

    // Create the tag locally (with signing if available)
    if (shouldSign) {
      await git.tag(['-s', '-a', tag, '-m', `Release ${tag}`])
      console.log(`✓ Created signed tag ${tag}`)
    } else {
      await git.addTag(tag)
      console.log(`✓ Created tag ${tag}`)
    }
    
    // Push the tag to remote
    await git.pushTags('origin')
    console.log(`✓ Pushed tag ${tag} to origin`)

    return { tag }
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      throw new CliError(`Tag ${tag} already exists locally`, {
        details: ["Delete the conflicting tag or run the command again later."],
        cause: error,
      })
    }

    throw new CliError("Failed to create or push the Nyron release tag", {
      details: [error instanceof Error ? error.message : String(error)],
      cause: error,
    })
  }
}