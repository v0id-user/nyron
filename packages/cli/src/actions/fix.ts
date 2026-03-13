import { loadConfig } from "../config/loader"
import type { NyronConfig } from "../config/types"
import { packageJsonExists, validatePackageJson } from "../package/read"
import { createPackageJson } from "../package/write"
import { resolve } from "path"
import { ask } from "../core/prompts"
import { fileExists, readFile } from "../core/files"
import { syncNyronState } from "../nyron/state"

interface PathIssue {
    projectName: string
    path: string
    type: "missing_dir" | "missing_package_json" | "invalid_package_json"
}

interface DetectedIssues {
    pathIssues: PathIssue[]
}

const detectIssues = async (config: NyronConfig): Promise<DetectedIssues> => {
    const issues: DetectedIssues = {
        pathIssues: [],
    }

    for (const [projectName, projectConfig] of Object.entries(config.projects)) {
        const fullPath = resolve(process.cwd(), projectConfig.path)
        
        if (!(await fileExists(fullPath))) {
            issues.pathIssues.push({
                projectName,
                path: projectConfig.path,
                type: "missing_dir"
            })
        } else if (!packageJsonExists(fullPath)) {
            issues.pathIssues.push({
                projectName,
                path: projectConfig.path,
                type: "missing_package_json"
            })
        } else if (!validatePackageJson(fullPath)) {
            issues.pathIssues.push({
                projectName,
                path: projectConfig.path,
                type: "invalid_package_json"
            })
        }
    }

    return issues
}

const promptForPathIssues = async (issues: DetectedIssues): Promise<string[]> => {
    const fixes: string[] = []

    // Group issues by type
    const missingDirs = issues.pathIssues.filter(i => i.type === "missing_dir")
    const missingPackageJsons = issues.pathIssues.filter(i => i.type === "missing_package_json")
    const invalidPackageJsons = issues.pathIssues.filter(i => i.type === "invalid_package_json")

    // Handle missing directories
    for (const issue of missingDirs) {
        console.log(`\n⚠️  Path "${issue.path}" for project "${issue.projectName}" doesn't exist.`)
        const answer = await ask("Create directory with package.json? (y/n): ")
        
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
            const fullPath = resolve(process.cwd(), issue.path)
            createPackageJson(fullPath, issue.projectName, "0.0.0")
            fixes.push(`Created directory and package.json for "${issue.projectName}" at ${issue.path}`)
        } else {
            fixes.push(`Skipped creating directory for "${issue.projectName}"`)
        }
    }

    // Handle missing package.json files
    for (const issue of missingPackageJsons) {
        console.log(`\n⚠️  package.json missing at "${issue.path}" for project "${issue.projectName}".`)
        const answer = await ask("Create package.json with version 0.0.0? (y/n): ")
        
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
            const fullPath = resolve(process.cwd(), issue.path)
            createPackageJson(fullPath, issue.projectName, "0.0.0")
            fixes.push(`Created package.json for "${issue.projectName}" at ${issue.path}`)
        } else {
            fixes.push(`Skipped creating package.json for "${issue.projectName}"`)
        }
    }

    // Handle invalid package.json files (missing version)
    for (const issue of invalidPackageJsons) {
        console.log(`\n⚠️  package.json at "${issue.path}" for project "${issue.projectName}" is missing the "version" field.`)
        const answer = await ask("Add version field with 0.0.0? (y/n): ")
        
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
            const fullPath = resolve(process.cwd(), issue.path)
            // Read existing package.json, add version, and write back
            const { readFileSync, writeFileSync } = await import("fs")
            const packageJsonPath = resolve(fullPath, "package.json")
            const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))
            packageJson.version = "0.0.0"
            writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n")
            fixes.push(`Added version field to package.json for "${issue.projectName}"`)
        } else {
            fixes.push(`Skipped adding version field for "${issue.projectName}"`)
        }
    }

    return fixes
}

async function readStateSnapshot() {
    const metaPath = resolve(process.cwd(), ".nyron/meta.json")
    const versionsPath = resolve(process.cwd(), ".nyron/versions.json")

    const [metaExists, versionsExists] = await Promise.all([
        fileExists(metaPath),
        fileExists(versionsPath),
    ])

    return {
        metaExists,
        versionsExists,
        metaContent: metaExists ? await readFile(metaPath) : null,
        versionsContent: versionsExists ? await readFile(versionsPath) : null,
    }
}

/**
 * Main fix command
 */
export const fix = async () => {
    console.log("🔍 Scanning Nyron setup for issues...\n")

    const { config } = await loadConfig()
    const before = await readStateSnapshot()

    // Phase 1: Repair filesystem issues that block metadata sync.
    const issues = await detectIssues(config)
    const promptFixes = await promptForPathIssues(issues)

    console.log("🔧 Auto-fixing issues...\n")
    await syncNyronState(config)
    const after = await readStateSnapshot()

    const allFixes: string[] = []

    if (!before.metaExists || !before.versionsExists) {
        allFixes.push("Created missing .nyron metadata files")
    }

    if (
        before.metaContent !== after.metaContent ||
        before.versionsContent !== after.versionsContent
    ) {
        allFixes.push("Synchronized .nyron metadata with nyron.config.ts and package.json versions")
    }

    allFixes.push(...promptFixes)

    console.log("\n" + "=".repeat(60))
    console.log("📋 Fix Summary")
    console.log("=".repeat(60) + "\n")
    
    if (allFixes.length === 0) {
        console.log("✅ No issues found! Your Nyron setup is in good shape.\n")
    } else {
        console.log("Applied fixes:\n")
        allFixes.forEach((fix, index) => {
            console.log(`  ${index + 1}. ${fix}`)
        })
        console.log(`\n✅ Total: ${allFixes.length} fix(es) applied.\n`)
    }
}