import { Probot } from "probot";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default (app: Probot) => {
  app.on(["pull_request.opened", "pull_request.synchronize"], async (context) => {
    const pr = context.payload.pull_request;

    // Post initial comment
    await context.octokit.issues.createComment(
      context.issue({
        body: `👋 Thanks for opening this PR, @${pr.user.login}! Reviewing your code... 🔥`,
      })
    );

    try {
      // Fetch the PR diff
      const diff = await context.octokit.pulls.get({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        pull_number: pr.number,
        mediaType: {
          format: "diff",
        },
      });

      // Get PR stats
      const additions = pr.additions;
      const deletions = pr.deletions;
      const changedFiles = pr.changed_files;

      // Send to GPT for roasting
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a brutally honest code reviewer who roasts code in a funny way.
Be sarcastic, witty, and savage but keep it lighthearted and fun.
Point out actual code issues but make it entertaining.
Keep your response under 500 words.`,
          },
          {
            role: "user",
            content: `Review this PR and roast it:

**Stats:**
- ${changedFiles} files changed
- ${additions} additions
- ${deletions} deletions

**Diff:**
\`\`\`diff
${diff.data}
\`\`\``,
          },
        ],
        temperature: 0.8,
        max_tokens: 800,
      });

      const roast = completion.choices[0].message.content;

      // Post the roast
      await context.octokit.issues.createComment(
        context.issue({
          body: `## 🔥 Code Roast\n\n${roast}\n\n---\n*Roasted by GPT-4*`,
        })
      );
    } catch (error) {
      console.error("Error generating roast:", error);
      await context.octokit.issues.createComment(
        context.issue({
          body: `❌ Failed to roast your code. Even the AI couldn't handle this mess. 💀`,
        })
      );
    }
  });
};
