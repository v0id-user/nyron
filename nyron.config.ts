import { defineConfig } from "@nyron/cli/config"

export default defineConfig({
  repo: "v0id-user/nyron",
  projects: {
    cli: {
      tagPrefix: "cli-v",
      path: "packages/cli",
    },
  },
  autoChangelog: false,
  onPushReminder: false,
})
