import path from "node:path"
import { writeFile } from "../core/files"
import {
  META_SCHEMA_REF,
  META_SCHEMA_ROOT_PATH,
} from "./meta/file-parser"
import {
  VERSIONS_SCHEMA_REF,
  VERSIONS_SCHEMA_ROOT_PATH,
} from "./versions/file-parser"

const JSON_SCHEMA_DRAFT = "https://json-schema.org/draft/2020-12/schema"

function buildMetaJsonSchema() {
  return {
    $schema: JSON_SCHEMA_DRAFT,
    $id: META_SCHEMA_REF,
    title: "Nyron meta state",
    type: "object",
    additionalProperties: false,
    required: ["$schema", "packages", "createdAt"],
    properties: {
      $schema: {
        type: "string",
        const: META_SCHEMA_REF,
      },
      packages: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["prefix", "version"],
          properties: {
            prefix: { type: "string" },
            version: { type: "string" },
          },
        },
      },
      createdAt: {
        type: "string",
        format: "date-time",
      },
      latestTag: {
        type: "string",
        pattern: "^nyron-release@",
      },
    },
  }
}

function buildVersionsJsonSchema() {
  return {
    $schema: JSON_SCHEMA_DRAFT,
    $id: VERSIONS_SCHEMA_REF,
    title: "Nyron version history state",
    type: "object",
    additionalProperties: false,
    required: ["$schema", "createdAt", "packages"],
    properties: {
      $schema: {
        type: "string",
        const: VERSIONS_SCHEMA_REF,
      },
      createdAt: {
        type: "string",
        format: "date-time",
      },
      packages: {
        type: "object",
        additionalProperties: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["prefix", "version"],
            properties: {
              prefix: { type: "string" },
              version: { type: "string" },
              lastPublished: {
                type: "string",
                format: "date-time",
              },
            },
          },
        },
      },
    },
  }
}

export async function writeNyronStateSchemas(): Promise<void> {
  await Promise.all([
    writeFile(
      path.join(process.cwd(), META_SCHEMA_ROOT_PATH),
      JSON.stringify(buildMetaJsonSchema(), null, 2),
    ),
    writeFile(
      path.join(process.cwd(), VERSIONS_SCHEMA_ROOT_PATH),
      JSON.stringify(buildVersionsJsonSchema(), null, 2),
    ),
  ])
}
