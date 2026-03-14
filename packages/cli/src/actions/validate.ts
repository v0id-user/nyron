import { CliError } from "../core/errors"
import { fileExists } from "../core/files"
import { META_ROOT_PATH, META_SCHEMA_ROOT_PATH } from "../nyron/meta/file-parser"
import { readMeta } from "../nyron/meta/reader"
import {
  VERSIONS_ROOT_PATH,
  VERSIONS_SCHEMA_ROOT_PATH,
} from "../nyron/versions/file-parser"
import { readVersions } from "../nyron/versions/reader"

export const validate = async () => {
  console.log("🔍 Validating Nyron state files...\n")

  const [metaSchemaExists, versionsSchemaExists] = await Promise.all([
    fileExists(META_SCHEMA_ROOT_PATH),
    fileExists(VERSIONS_SCHEMA_ROOT_PATH),
  ])

  if (!metaSchemaExists || !versionsSchemaExists) {
    throw new CliError("Missing Nyron state schema files", {
      details: [
        `Expected: ${META_SCHEMA_ROOT_PATH} and ${VERSIONS_SCHEMA_ROOT_PATH}`,
        "Run 'nyron init' or 'nyron fix' to regenerate the schema-backed state files.",
      ],
    })
  }

  const [meta, versions] = await Promise.all([readMeta(), readVersions()])

  console.log(`✓ ${META_ROOT_PATH} is valid (${meta.packages.length} package(s))`)
  console.log(
    `✓ ${VERSIONS_ROOT_PATH} is valid (${Object.keys(versions.packages).length} project history bucket(s))`,
  )
  console.log(`✓ Local schemas found at ${META_SCHEMA_ROOT_PATH} and ${VERSIONS_SCHEMA_ROOT_PATH}`)
  console.log("\n✅ Nyron state files are valid\n")
}
