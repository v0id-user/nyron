import simpleGit from "simple-git"
import type { CommitDiff } from "../github/types"

const RECORD_SEPARATOR = "\u001e"
const FIELD_SEPARATOR = "\u001f"

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
    .filter((folder, index, all) => folder !== all[index - 1])
}

async function getAffectedFoldersForCommit(sha: string): Promise<string[]> {
  const git = simpleGit()
  const output = await git.raw([
    "diff-tree",
    "--no-commit-id",
    "--name-only",
    "-r",
    sha,
  ])

  const files = output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .sort()

  return toAffectedFolders(files)
}

async function readGitCommits(
  revisionRange: string,
  repo: string,
): Promise<CommitDiff[]> {
  const git = simpleGit()
  const output = await git.raw([
    "log",
    revisionRange,
    `--format=%H${FIELD_SEPARATOR}%s${FIELD_SEPARATOR}%an <%ae>${RECORD_SEPARATOR}`,
  ])

  const rawCommits = output
    .split(RECORD_SEPARATOR)
    .map((entry) => entry.trim())
    .filter(Boolean)

  const commits = await Promise.all(
    rawCommits.map(async (entry) => {
      const [hash, message, author] = entry.split(FIELD_SEPARATOR)
      return {
        hash: hash ?? "",
        message: message ?? "",
        author: author ?? "unknown",
        repo,
        githubUser: undefined,
        avatar: undefined,
        url: undefined,
        affectedFolders: await getAffectedFoldersForCommit(hash ?? ""),
      } satisfies CommitDiff
    }),
  )

  return commits
}

export async function getGitCommitsBetween(
  fromRef: string,
  toRef: string,
  repo: string,
): Promise<CommitDiff[]> {
  return readGitCommits(`${fromRef}..${toRef}`, repo)
}

export async function getGitCommitsSince(
  fromRef: string,
  repo: string,
): Promise<CommitDiff[]> {
  return getGitCommitsBetween(fromRef, "HEAD", repo)
}

export async function getGitCommitsUntil(
  toRef: string,
  repo: string,
): Promise<CommitDiff[]> {
  return readGitCommits(toRef, repo)
}
