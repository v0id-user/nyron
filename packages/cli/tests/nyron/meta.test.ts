import { describe, it, expect } from "bun:test"
import { MetaSchema } from "../../src/nyron/meta/schema"

describe("MetaSchema", () => {
  it("should be valid", () => {
    const meta = MetaSchema.assert({
      packages: [
        {
          prefix: "test",
          version: "1.0.0"
        }
      ],
      createdAt: "2026-01-01T00:00:00.000Z",
      latestTag: "nyron-release@2026-01-01@00-00-00.000"
    })
    expect(meta).toBeDefined()
  })

  it("should allow latestTag to be omitted", () => {
    const meta = MetaSchema.assert({
      packages: [
        {
          prefix: "projA",
          version: "0.1.2"
        }
      ],
      createdAt: "2026-01-01T00:00:00.000Z",
    })
    expect(meta).toBeDefined()
    expect(meta.latestTag).toBeUndefined()
  })

  it("should fail if required prop is missing", () => {
    expect(() =>
      MetaSchema.assert({
        packages: [
          {
            prefix: "bar",
            version: "2.3.4"
          }
        ],
        // createdAt is missing
        latestTag: "nyron-release@2026-01-01@00-00-00.000"
      })
    ).toThrow()
  })
})
