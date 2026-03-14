// Parse commits and group them by type
// For example a all "fix:" prefixed commits -> Bug fixes
// a all "feat:" prefixed commits -> Features
// etc...

import { parseRepo } from "./repo-parser"
import { hasGitHubToken, resolveOctokit, type CommitDiff } from "./types"
import {
  getGitCommitsBetween,
  getGitCommitsSince,
  getGitCommitsUntil,
} from "../git/commits"

function toAffectedFolders(files: string[]): string[] {
  return files
    .filter(Boolean)
    .map((filename) => {
      const parts = filename.split("/")

      if (parts.length === 1) {
        return parts[0]
      }

      return parts.slice(0, 2).join("/")
    })
    .sort()
    .filter((folder, index, all) => folder !== all[index - 1])
}

async function fetchCommitsFromComparison(
  base: string,
  head: string,
  repo: string,
  clientOrContext?: unknown
): Promise<CommitDiff[]> {
  if (!clientOrContext && !hasGitHubToken()) {
    return getGitCommitsBetween(base, head, repo)
  }

  const { owner, repo: repoName } = parseRepo(repo)
  const octokit = resolveOctokit(clientOrContext as any)

  const { data: comparison } = await octokit.rest.repos.compareCommits({
    owner,
    repo: repoName,
    base,
    head,
  })

  // Fetch detailed commit information for each commit to get the files
  // TODO: this might spam the hell out of github api so we might defalute
  //       to simple-git later
  const commitsWithFiles = await Promise.all(
    comparison.commits.map(async (commit) => {
      const { data: detailedCommit } = await octokit.rest.repos.getCommit({
        owner,
        repo: repoName,
        ref: commit.sha,
      })
      return detailedCommit
    })
  )

  return commitsWithFiles.map((commit) => {
    // Extract author in git format: "John Doe <john.doe@example.com>"
    const authorName = commit.commit.author?.name || "unknown";
    const authorEmail = commit.commit.author?.email || "unknown";
    const gitFormatAuthor = `${authorName} <${authorEmail}>`;

    const affectedFolders = toAffectedFolders((commit.files || [])
      .map((file) => file.filename)
      .filter((f): f is string => Boolean(f))
    )

    return {
      hash: commit.sha,
      message: commit.commit.message,
      author: gitFormatAuthor,
      repo,
      githubUser: commit.author?.login!,
      avatar: commit.author?.avatar_url,
      url: commit.html_url,
      affectedFolders,
    };
  });
}

export async function getCommitsBetween(fromTag: string, toTag: string, repo: string, clientOrContext?: unknown): Promise<CommitDiff[]> {
  return fetchCommitsFromComparison(fromTag, toTag, repo, clientOrContext)
}

export async function getCommitsSince(releaseTag: string, repo: string, clientOrContext?: unknown): Promise<CommitDiff[]> {
  if (!clientOrContext && !hasGitHubToken()) {
    return getGitCommitsSince(releaseTag, repo)
  }

  return getCommitsBetween(releaseTag, "HEAD", repo, clientOrContext)
}

export async function getCommitsUntil(
  releaseTag: string,
  repo: string,
): Promise<CommitDiff[]> {
  // First-release fallback only needs local git history and works offline.
  return getGitCommitsUntil(releaseTag, repo)
}