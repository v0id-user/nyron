import { ProjectChange } from "../hooks/types.js";

type RepoContext = {
  owner: string;
  repo: string;
  headSha?: string;
  baseSha?: string;
};

export function buildProjectChangesComment(
  projectChanges: Array<ProjectChange>,
  repo: RepoContext
): string {
  const impacted = projectChanges.filter((p) => p.impacted);
  const notImpacted = projectChanges.filter((p) => !p.impacted);

  const header = "## Nyron project impact\n\n";
  const subheader =
    "This analysis shows which configured Nyron projects are touched by this PR.\n\n";

  const tableHeader =
    "| Project | Path | Impacted | Changed folders |\n|---|---|---|---|\n";
  const tableRows = projectChanges
    .map(({ projectName, path, impacted: imp, changedFolders }) => {
      const status = imp ? "Yes" : "No";
      const count =
        changedFolders.length > 0 ? String(changedFolders.length) : "—";
      return `| ${projectName} | \`${path}\` | ${status} | ${count} |`;
    })
    .join("\n");

  let sections = "";
  if (impacted.length > 0) {
    sections += "### Impacted projects\n\n";
    sections += impacted
      .map(({ projectName, path, changedFolders }) => {
        const title = `**${projectName}** (\`${path}\`)\n`;
        const folders =
          changedFolders.length > 0
            ? `Changed folders:\n${changedFolders.map((f) => `- \`${f}\``).join("\n")}\n`
            : "";
        const action = `\n**Suggested action:** Run \`nyron bump --project ${projectName}\` (or \`--type patch|minor|major\`) to version and release.\n`;
        return title + folders + action;
      })
      .join("\n\n");
  }

  if (notImpacted.length > 0) {
    sections += "\n### Unchanged projects\n\n";
    sections += notImpacted
      .map(({ projectName, path }) => `- **${projectName}** (\`${path}\`)`)
      .join("\n");
    sections += "\n";
  }

  if (repo.baseSha && repo.headSha) {
    sections += `\n[Compare changes](/${repo.owner}/${repo.repo}/compare/${repo.baseSha}...${repo.headSha})\n`;
  }

  const note =
    "\n---\n*Analysis compares this PR's commits (base → head) and maps changed paths to configured Nyron projects.*";

  return header + subheader + tableHeader + tableRows + "\n\n" + sections + note;
}


