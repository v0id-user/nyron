import path from "node:path"
import { type } from "arktype"
import { CliError } from "../core/errors"
import { readFile } from "../core/files"

interface StateFileDefinition<T> {
  label: string
  rootPath: string
  expectedShape: string
  schema: (input: unknown) => T | unknown
}

function isArkTypeErrors(value: unknown): value is { summary: string } {
  return (
    value instanceof type.errors ||
    (Boolean(value) &&
      typeof value === "object" &&
      "summary" in value &&
      "byPath" in value)
  )
}

function describeObservedShape(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [`Observed top-level type: array (${value.length} item(s))`]
  }

  if (!value || typeof value !== "object") {
    return [`Observed top-level type: ${typeof value}`]
  }

  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  const details = [
    `Observed top-level keys: ${keys.length > 0 ? keys.join(", ") : "(none)"}`,
  ]

  const packages = record["packages"]

  if (Array.isArray(packages) && packages[0] && typeof packages[0] === "object") {
    details.push(
      `Observed packages[0] keys: ${Object.keys(
        packages[0] as Record<string, unknown>,
      ).join(", ")}`,
    )
  }

  if (packages && typeof packages === "object" && !Array.isArray(packages)) {
    const packageEntries = Object.entries(packages as Record<string, unknown>)
    const firstPackage = packageEntries[0]

    if (firstPackage) {
      details.push(`Observed packages keys: ${packageEntries.map(([key]) => key).join(", ")}`)

      const [, history] = firstPackage
      if (Array.isArray(history) && history[0] && typeof history[0] === "object") {
        details.push(
          `Observed packages.${firstPackage[0]}[0] keys: ${Object.keys(
            history[0] as Record<string, unknown>,
          ).join(", ")}`,
        )
      }
    }
  }

  return details
}

export async function readStateFile<T>(
  definition: StateFileDefinition<T>,
): Promise<T> {
  const absolutePath = path.join(process.cwd(), definition.rootPath)

  let rawContent: string
  try {
    rawContent = await readFile(absolutePath)
  } catch (error) {
    throw new CliError(`Missing ${definition.label} state file`, {
      details: [
        `File: ${definition.rootPath}`,
        "Run 'nyron init' or 'nyron fix' to recreate the Nyron state files.",
      ],
      cause: error,
    })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch (error) {
    throw new CliError(`Invalid ${definition.label} JSON`, {
      details: [
        `File: ${definition.rootPath}`,
        `Expected shape: ${definition.expectedShape}`,
        error instanceof Error ? `Parse error: ${error.message}` : String(error),
      ],
      cause: error,
    })
  }

  const result = definition.schema(parsed)
  if (isArkTypeErrors(result)) {
    throw new CliError(`Invalid ${definition.label} state file`, {
      details: [
        `File: ${definition.rootPath}`,
        `Expected shape: ${definition.expectedShape}`,
        `Validation error: ${result.summary}`,
        ...describeObservedShape(parsed),
      ],
      cause: result,
    })
  }

  return result as T
}
