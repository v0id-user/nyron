import { pushNyronReleaseTag } from "../github/tags"
import { loadConfig } from "../config/loader"
import { setMetaLatestTag } from "../nyron/meta/writer"
import { syncNyronState } from "../nyron/state"

export const pushNyronReleaseTagAction = async () => {
  const { config } = await loadConfig()
  await syncNyronState(config)
  const { tag } = await pushNyronReleaseTag(config.repo)
  
  // Update meta.json with the new tag
  await setMetaLatestTag(tag)
  console.log(`✅ Updated meta.json with latest tag: ${tag}`)
  console.log("⚠️  Commit the updated .nyron state files before your next release step.")
  console.log('   → Suggested commit: chore(nyron): update release tag')
}