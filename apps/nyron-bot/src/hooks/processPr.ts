import { Context } from "probot";
import { extractPrInfo } from "../utils/extractPrInfo.js";
import { getParsedNyronConfig } from "../utils/getParsedNyronConfig.js";
import { getCommitsBetween } from "@nyron/cli/github/commits";
import { ProjectChange } from "./types.js";
import { PullRequest } from "../types/pull-request.js";

function folderMatchesProjectPath(folder: string, projectPath: string): boolean {
  if (folder === projectPath) return true;
  if (folder.startsWith(projectPath + "/")) return true;
  if (projectPath.startsWith(folder + "/")) return true;
  return false;
}

export async function processPr(
  context: Context<"pull_request">
): Promise<{ pr: PullRequest; projectChanges: Array<ProjectChange> }> {
  const pr = extractPrInfo(context.payload.pull_request);
  const config = await getParsedNyronConfig(context, pr);

  const baseSha = context.payload.pull_request.base.sha;
  const headSha = context.payload.pull_request.head.sha;

  const commits = await getCommitsBetween(
    baseSha,
    headSha,
    config.repo,
    context.octokit
  );

  const allChangedFolders = [
    ...new Set(commits.flatMap((c) => c.affectedFolders)),
  ];

  const projectChanges: Array<ProjectChange> = Object.entries(
    config.projects
  ).map(([projectName, project]) => {
    const changedFolders = allChangedFolders.filter((folder) =>
      folderMatchesProjectPath(folder, project.path)
    );
    const impacted = changedFolders.length > 0;

    return {
      projectName,
      path: project.path,
      impacted,
      changedFolders,
      tagPrefix: project.tagPrefix,
    };
  });

  return { pr, projectChanges };
}
