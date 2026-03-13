import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test"

const mockReadMeta = mock(() =>
  Promise.resolve({
    packages: [{ prefix: "cli", version: "1.2.4" }],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  }),
)

const mockReadVersions = mock(() =>
  Promise.resolve({
    createdAt: "2026-01-01T00:00:00.000Z",
    packages: {
      cli: [
        { prefix: "cli", version: "1.2.3" },
        { prefix: "cli", version: "1.2.4" },
      ],
    },
  }),
)

mock.module("../../src/nyron/meta/reader", () => ({
  readMeta: mockReadMeta,
}))

mock.module("../../src/nyron/versions/reader", () => ({
  readVersions: mockReadVersions,
}))

let getUpdatedVersions: typeof import("../../src/nyron/version").getUpdatedVersions

beforeAll(async () => {
  ;({ getUpdatedVersions } = await import("../../src/nyron/version"))
})

describe("getUpdatedVersions", () => {
  beforeEach(() => {
    mockReadMeta.mockClear()
    mockReadVersions.mockClear()
  })

  it("returns previous-to-current version transitions", async () => {
    await expect(getUpdatedVersions()).resolves.toEqual([
      "cli@1.2.3 -> cli@1.2.4",
    ])
  })

  it("skips packages without a previous version", async () => {
    mockReadVersions.mockResolvedValueOnce({
      createdAt: "2026-01-01T00:00:00.000Z",
      packages: {
        cli: [{ prefix: "cli", version: "1.2.4" }],
      },
    })

    await expect(getUpdatedVersions()).resolves.toEqual([])
  })
})