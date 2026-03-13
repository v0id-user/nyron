import { readdir } from "node:fs/promises"
import path from "node:path"
import {
  getPackageName,
  getPackageVersion,
  getPackageWorkspaces,
  packageJsonExists,
} from "../package/read"

export interface DiscoveredProject {
  id: string
  path: string
  packageName?: string
  version: string
  tagPrefix: string
}

function toProjectId(projectPath: string, packageName?: string): string {
  const fromPackageName = packageName?.split("/").at(-1)?.trim()
  const candidate = fromPackageName || path.basename(projectPath) || "main"
  return candidate.replace(/[^a-zA-Z0-9_-]/g, "-")
}

function toTagPrefix(projectPath: string, packageName?: string): string {
  if (projectPath === ".") {
    return "v"
  }

  if (packageName) {
    return `${packageName}@`
  }

  return `${path.basename(projectPath)}@`
}

async function expandWorkspacePattern(
  cwd: string,
  pattern: string,
): Promise<string[]> {
  if (pattern === "." && packageJsonExists(cwd)) {
    return ["."]
  }

  if (!pattern.endsWith("/*")) {
    const absolutePath = path.resolve(cwd, pattern)
    return packageJsonExists(absolutePath) ? [pattern] : []
  }

  const parent = pattern.slice(0, -2)
  const parentPath = path.resolve(cwd, parent)

  try {
    const entries = await readdir(parentPath, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.posix.join(parent.replace(/\\/g, "/"), entry.name))
      .filter((projectPath) => packageJsonExists(path.resolve(cwd, projectPath)))
  } catch {
    return []
  }
}

export async function discoverProjects(
  cwd: string = process.cwd(),
): Promise<DiscoveredProject[]> {
  const workspaces = packageJsonExists(cwd) ? getPackageWorkspaces(cwd) : []
  const discoveredPaths = new Set<string>()

  if (workspaces.length === 0) {
    if (packageJsonExists(cwd)) {
      discoveredPaths.add(".")
    }
  } else {
    for (const workspacePattern of workspaces) {
      const projectPaths = await expandWorkspacePattern(cwd, workspacePattern)
      for (const projectPath of projectPaths) {
        discoveredPaths.add(projectPath)
      }
    }
  }

  return [...discoveredPaths]
    .sort()
    .map((projectPath) => {
      const absolutePath = projectPath === "." ? cwd : path.resolve(cwd, projectPath)
      const packageName = getPackageName(absolutePath)

      return {
        id: toProjectId(projectPath, packageName),
        path: projectPath,
        packageName,
        version: getPackageVersion(absolutePath) ?? "0.0.0",
        tagPrefix: toTagPrefix(projectPath, packageName),
      }
    })
}
