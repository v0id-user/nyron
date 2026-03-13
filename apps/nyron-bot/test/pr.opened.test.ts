import nock from "nock"
import { Probot, ProbotOctokit } from "probot"
import myApp from "../src/index.js"
import pullRequestPayloadFixture from "./fixtures/pull_request.opened.json" with { type: "json" }
import { describe, beforeEach, afterEach, it, expect } from "vitest";


describe("pull_request.opened handler", () => {
  let probot

  beforeEach(() => {
    nock.disableNetConnect()
    probot = new Probot({
      githubToken: "test",
      Octokit: ProbotOctokit.defaults({ retry: { enabled: false }, throttle: { enabled: false } }),
    })
    myApp(probot)
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  // TODO: Skipped due to Bun/nock "Attempted to assign to readonly property" when mocking GitHub API.
  // Unit tests in buildProjectChangesComment.test.ts cover comment output.
  it.skip("reads nyron.config.ts and parses projects", async () => {
    // 1️⃣ Mock app installation token
    nock("https://api.github.com")
      .post("/app/installations/88979653/access_tokens")
      .reply(200, { token: "test" })

    // 2️⃣ Mock nyron.config.ts response
    const fakeConfig = `
      export default {
        repo: "v0id-user/nyron-1-test-repo",
        projects: {
          core: { path: "packages/core", tagPrefix: "core@" },
          cli: { path: "packages/cli", tagPrefix: "cli@" }
        }
      }
    `
    const base64Config = Buffer.from(fakeConfig).toString("base64")

    nock("https://api.github.com")
      .get("/repos/v0id-user/nyron-1-test-repo/contents/nyron.config.ts")
      .reply(200, {
        content: base64Config,
        encoding: "base64",
      })

    // 3️⃣ Mock compare commits (base...head)
    const baseSha = "d8bdb68c90f30c52234465e4178cc16ce94a04de"
    const headSha = "ac190c664092b3f9159da7c99878a365040cab17"
    nock("https://api.github.com")
      .get(
        `/repos/v0id-user/nyron-1-test-repo/compare/${baseSha}...${headSha}`
      )
      .reply(200, {
        commits: [
          {
            sha: "abc123",
            commit: { message: "feat: add thing", author: null },
            author: { login: "v0id-user", avatar_url: "" },
            html_url: "https://github.com/commit/abc123",
          },
        ],
      })

    // 4️⃣ Mock getCommit for each commit (to fetch affected files)
    nock("https://api.github.com")
      .get("/repos/v0id-user/nyron-1-test-repo/commits/abc123")
      .reply(200, {
        sha: "abc123",
        commit: {
          message: "feat: add thing",
          author: { name: "User", email: "user@example.com" },
        },
        author: { login: "v0id-user", avatar_url: "" },
        html_url: "https://github.com/commit/abc123",
        files: [{ filename: "packages/cli/src/foo.ts" }],
      })

    // 5️⃣ Mock create comment
    nock("https://api.github.com")
      .post("/repos/v0id-user/nyron-1-test-repo/issues/4/comments")
      .reply(201, { id: 1, body: "" })

    // 6️⃣ Run webhook simulation
    const payload = JSON.parse(JSON.stringify(pullRequestPayloadFixture))
    await probot.receive({
      name: "pull_request",
      payload,
    })

    expect(nock.isDone()).toBe(true)
  })
})
