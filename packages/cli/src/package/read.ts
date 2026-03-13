import { readFileSync, existsSync } from "fs"
import { resolve, basename } from "path"

export interface PackageJson {
  name?: string
  version?: string
  repository?:
    | string
    | {
        type?: string
        url?: string
      }
  workspaces?: string[] | { packages?: string[] }
  [key: string]: unknown
}

function resolvePackageJsonPath(path: string): string {
  return basename(path) === "package.json"
    ? path
    : resolve(path, "package.json")
}

export const readPackageJson = (path: string): PackageJson => {
  return JSON.parse(readFileSync(resolvePackageJsonPath(path), "utf8")) as PackageJson
}

export const getPackageVersion = (path: string) => {
  return readPackageJson(path).version
}

export const getPackageName = (path: string) => {
  return readPackageJson(path).name
}

export const getPackageWorkspaces = (path: string): string[] => {
  const packageJson = readPackageJson(path)
  const workspaces = packageJson.workspaces

  if (Array.isArray(workspaces)) {
    return workspaces
  }

  if (
    workspaces &&
    typeof workspaces === "object" &&
    Array.isArray(workspaces.packages)
  ) {
    return workspaces.packages
  }

  return []
}

/**
 * Checks if a package.json file exists at the specified path.
 * 
 * @param {string} path - The directory path to check for package.json
 * @returns {boolean} True if package.json exists, false otherwise
 * 
 * @example
 * ```typescript
 * if (packageJsonExists("./my-package")) {
 *   console.log("package.json found!")
 * }
 * ```
 */
export const packageJsonExists = (path: string): boolean => {
  return existsSync(resolvePackageJsonPath(path))
}

/**
 * Validates that a package.json file exists and has a valid "version" field.
 * 
 * @param {string} path - The directory path containing package.json
 * @returns {boolean} True if package.json exists and has a version field, false otherwise
 * 
 * @example
 * ```typescript
 * if (validatePackageJson("./my-package")) {
 *   console.log("Valid package.json!")
 * }
 * ```
 */
export const validatePackageJson = (path: string): boolean => {
  try {
    const packageJsonPath = resolvePackageJsonPath(path)
    
    if (!existsSync(packageJsonPath)) {
      return false
    }
    
    const packageJson = readPackageJson(packageJsonPath)
    return typeof packageJson.version === "string" && packageJson.version.length > 0
  } catch {
    return false
  }
}