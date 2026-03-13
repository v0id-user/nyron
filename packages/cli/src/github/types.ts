
export interface Repo {
    owner: string
    repo: string
}

import { Octokit } from "octokit"
import type { Context } from "probot"

export type OctokitClientOrContext = Octokit | Pick<Context, "octokit"> | undefined

let defaultOctokit: Octokit | null = null

export function hasGitHubToken(): boolean {
  return Boolean(process.env["GITHUB_TOKEN"])
}

function getDefaultOctokit(): Octokit {
  if (!defaultOctokit) {
    const token = process.env['GITHUB_TOKEN']
    if (!token) {
      throw new Error(
        [
          '❌ GitHub authentication failed: GITHUB_TOKEN is not set.',
          '',
          'To fix this, set the GITHUB_TOKEN environment variable with a valid GitHub personal access token.',
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