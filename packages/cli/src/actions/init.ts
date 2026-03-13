import { existsSync, writeFileSync } from "fs"
import path from "path"
import type { InitOptions, InitResult } from "./types"
import { syncNyronState } from "../nyron/state"
import { detectRepoSlug } from "../utils/detectRepo"
import { discoverProjects, type DiscoveredProject } from "../utils/discoverProjects"

function renderProjects(projects: DiscoveredProject[]): string {
  return projects
    .map(
      (project) => `    ${JSON.stringify(project.id)}: {
      tagPrefix: ${JSON.stringify(project.tagPrefix)},
      path: ${JSON.stringify(project.path)},
    },`,
    )
    .join("\n")
}

function buildConfigSource(repo: string, projects: DiscoveredProject[]): string {
  const safeProjects = projects.length
    ? projects
    : [
        {
          id: "main",
          path: ".",
          packageName: undefined,
          version: "0.0.0",
          tagPrefix: "v",
        },
      ]

  return `import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: ${JSON.stringify(repo)},
  projects: {
${renderProjects(safeProjects)}
  },
})
`
}

export async function init(options: InitOptions): Promise<InitResult> {
  const filename = "nyron.config.ts"
  const filepath = path.resolve(process.cwd(), filename)
  const hadExistingConfig = existsSync(filepath)
  const fallbackProject: DiscoveredProject = {
    id: "main",
    path: ".",
    packageName: undefined,
    version: "0.0.0",
    tagPrefix: "v",
  }

  if (hadExistingConfig && !options.force) {
    console.log(`⚠️  Configuration already exists: ${filename}`)
    console.log(`   → Use --force to overwrite`)
    return { created: false, filepath, overwritten: false }
  }

  const [repo, projects] = await Promise.all([
    detectRepoSlug(),
    discoverProjects(),
  ])
  const safeProjects = projects.length ? projects : [fallbackProject]
  const sample = buildConfigSource(repo, safeProjects)

  writeFileSync(filepath, sample, "utf-8")
  await syncNyronState({
    repo,
    projects: Object.fromEntries(
      safeProjects.map((project) => [
        project.id,
        {
          tagPrefix: project.tagPrefix,
          path: project.path,
        },
      ]),
    ),
  })

  console.log(`✅ Created ${filename}`)
  console.log(`   → Initialized .nyron metadata for ${safeProjects.length} project(s)`)

  return { created: true, filepath, overwritten: hadExistingConfig && !!options.force }
}
