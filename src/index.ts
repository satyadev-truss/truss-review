import { Probot } from "probot";
import { OpenAIService } from "./services/openai.js";
import { createSuccessComment, createFallbackComment } from "./prompts.js";
import { getUserContext } from "./user-profiles.js";

const openaiService = new OpenAIService(process.env.OPENAI_API_KEY!);
const processedPRs = new Set<string>();

export default (app: Probot) => {
  app.on("pull_request.opened", async (context) => {
    const pr = context.payload.pull_request;

    const prId = `${context.repo().owner}/${context.repo().repo}#${pr.number}`;

    if (processedPRs.has(prId)) {
      return;
    }

    processedPRs.add(prId);

    try {
      // Get PR diff
      const diff = await context.octokit.pulls.get({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        pull_number: pr.number,
        mediaType: {
          format: "diff",
        },
      });

      // Get PR stats
      const stats = {
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
      };

      // Get author context for personalized roasting
      const authorContext = getUserContext(pr.user.login);

      // Generate roast using OpenAI service
      const roast = await openaiService.generateRoast(stats, diff.data, authorContext || undefined);

      // Post success comment
      await context.octokit.issues.createComment(
        context.issue({
          body: createSuccessComment(pr.user.login, roast),
        })
      );

      processedPRs.delete(prId);

    } catch (error) {
      console.error("Error generating roast:", error);
      processedPRs.delete(prId);

      try {
        await context.octokit.issues.createComment(
          context.issue({
            body: createFallbackComment(pr.user.login),
          })
        );
        processedPRs.delete(prId);
      } catch (commentError) {
        console.error("Failed to post fallback comment:", commentError);
        processedPRs.delete(prId);
      }
    }
  });
};
