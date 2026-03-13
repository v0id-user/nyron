
import { Context } from "probot";
import { buildProjectChangesComment } from "../utils/buildProjectChangesComment.js";
import { processPr } from "./processPr.js";

export async function pullRequestOpened(context: Context<"pull_request">) {
  const {pr,projectChanges} = await processPr(context);

  // Build a formal GitHub-flavored Markdown comment summarizing changes
  const commentBody = buildProjectChangesComment(projectChanges, {
    owner: pr.owner,
    repo: pr.repo,
    baseSha: context.payload.pull_request.base.sha,
    headSha: context.payload.pull_request.head.sha,
  });
  
  await context.octokit.rest.issues.createComment({
    owner: pr.owner,
    repo: pr.repo,
    issue_number: pr.number,
    body: commentBody,
  });
}
