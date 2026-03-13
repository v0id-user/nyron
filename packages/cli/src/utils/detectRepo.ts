import simpleGit from "simple-git"
import { packageJsonExists, readPackageJson } from "../package/read"

function normalizeRepositoryUrl(url: string): string | null {
  const trimmed = url.trim().replace(/\.git$/, "")
  const sshMatch = trimmed.match(/^git@github\.com:(.+)$/)

  if (sshMatch?.[1]) {
    return sshMatch[1]
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname === "github.com") {
      return parsed.pathname.replace(/^\/+/, "")
    }
  } catch {
    // ignore invalid URL and fall back to null
  }

  return null
}

export async function detectRepoSlug(cwd: string = process.cwd()): Promise<string> {
  const git = simpleGit(cwd)

  try {
    const remoteUrl = (await git.remote(["get-url", "origin"])).trim()
    const parsed = normalizeRepositoryUrl(remoteUrl)

    if (parsed) {
      return parsed
    }
  } catch {
    // Ignore git discovery failures and fall back to package.json
  }

  if (packageJsonExists(cwd)) {
    const packageJson = readPackageJson(cwd)
    const repository = packageJson.repository

    if (typeof repository === "string") {
      return normalizeRepositoryUrl(repository) ?? "owner/repo"
    }

    if (repository?.url && typeof repository.url === "string") {
      return normalizeRepositoryUrl(repository.url) ?? "owner/repo"
    }
  }

  return "owner/repo"
}
