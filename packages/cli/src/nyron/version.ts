import { readMeta } from "./meta/reader"
import { readVersions } from "./versions/reader"

export async function getUpdatedVersions(): Promise<string[]> {
    const meta = await readMeta()
    const versions = await readVersions()

    return meta.packages.flatMap((packageInfo) => {
        const history = versions.packages[packageInfo.prefix] ?? []
        const latestEntry = history.at(-1)
        const previousEntry = history.at(-2)

        if (!latestEntry) {
            return []
        }

        if (previousEntry && previousEntry.version !== latestEntry.version) {
            return [
                `${packageInfo.prefix}@${previousEntry.version} -> ${packageInfo.prefix}@${latestEntry.version}`,
            ]
        }

        return []
    })
}