
export interface Repo {
    owner: string
    repo: string
}

import { Octokit } from "octokit"
import { execFileSync } from "node:child_process"
import type { Context } from "probot"

export type OctokitClientOrContext = Octokit | Pick<Context, "octokit"> | undefined

let defaultOctokit: Octokit | null = null
let cachedGitHubToken: string | null = null
let attemptedGhFallback = false

export function hasGitHubToken(): boolean {
  return Boolean(resolveGitHubToken())
}

export function resolveGitHubToken(): string | undefined {
  const envToken = process.env["GITHUB_TOKEN"] || process.env["GH_TOKEN"]
  if (envToken) {
    cachedGitHubToken = envToken
    return envToken
  }

  if (cachedGitHubToken) {
    return cachedGitHubToken
  }

  if (attemptedGhFallback) {
    return undefined
  }

  attemptedGhFallback = true

  try {
    const ghToken = execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()

    if (ghToken) {
      cachedGitHubToken = ghToken
      return ghToken
    }
  } catch {
    return undefined
  }

  return undefined
}

function getDefaultOctokit(): Octokit {
  if (!defaultOctokit) {
    const token = resolveGitHubToken()
    if (!token) {
      throw new Error(
        [
          '❌ GitHub authentication failed: no GitHub token is available.',
          '',
          'To fix this, set GITHUB_TOKEN (or GH_TOKEN) with a valid GitHub personal access token.',
          'If you already use GitHub CLI, run `gh auth login` so Nyron can fall back to `gh auth token`.',
          '',
          'Example:',
          '  export GITHUB_TOKEN=ghp_xxxYourTokenHerexxx',
          '',
          'You can create a token at: https://github.com/settings/tokens',
          'Required scopes: "repo" (for private repos) or "public_repo" (for public repos).',
          '',
          'Tip: You can also add GITHUB_TOKEN to your .env file for local development.'
        ].join('\n')
      )
    }
    defaultOctokit = new Octokit({ auth: token })
  }
  return defaultOctokit
}

export function resolveOctokit(clientOrContext?: OctokitClientOrContext): Octokit {
  if (!clientOrContext) return getDefaultOctokit()
  if (typeof (clientOrContext as any).rest === 'object') {
    return clientOrContext as Octokit
  }
  if (typeof (clientOrContext as any).octokit === 'object') {
    return (clientOrContext as Pick<Context, "octokit">).octokit as unknown as Octokit
  }
  return getDefaultOctokit()
}

export function resetGitHubAuthCacheForTests(): void {
  defaultOctokit = null
  cachedGitHubToken = null
  attemptedGhFallback = false
}

export interface CommitDiff {
  hash: string
  message: string
  affectedFolders: string[]
  repo: string
  author: string
  githubUser?: string
  avatar?: string
  url?: string
}