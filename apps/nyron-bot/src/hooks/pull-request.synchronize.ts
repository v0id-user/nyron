
import { Context } from "probot";
import { buildProjectChangesComment } from "../utils/buildProjectChangesComment.js";
import { processPr } from "./processPr.js";
import { extractNyronyComment } from "./extractNyronyComment.js";


export async function pullRequestSynchronize(context: Context<"pull_request">) {
  const { pr, projectChanges } = await processPr(context);

  // Build a formal GitHub-flavored Markdown comment summarizing changes
  const commentBody = buildProjectChangesComment(projectChanges, {
    owner: pr.owner,
    repo: pr.repo,
    baseSha: context.payload.pull_request.base.sha,
    headSha: context.payload.pull_request.head.sha,
  });

  const nyronyComment = await extractNyronyComment(context, pr);

  await context.octokit.rest.issues.updateComment({
    owner: pr.owner,
    repo: pr.repo,
    comment_id: nyronyComment.id,
    body: commentBody,
  });
}
