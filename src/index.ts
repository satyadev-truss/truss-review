import { Probot } from "probot";

export default (app: Probot) => {
  app.on(["pull_request.opened"], async (context) => {
    const pr = context.payload.pull_request;
    
    // Get the file diffs
    const { data: files } = await context.octokit.pulls.listFiles({
      owner: context.repo().owner,
      repo: context.repo().repo,
      pull_number: pr.number,
    });
    
    console.log("=== FILE DIFFS ===");
    files.forEach((file: any) => {
      console.log(`\n📁 File: ${file.filename}`);
      console.log(`Status: ${file.status}`);
      console.log(`Additions: +${file.additions}`);
      console.log(`Deletions: -${file.deletions}`);
      console.log(`Changes: ${file.changes}`);
      if (file.patch) {
        console.log("Diff:");
        console.log(file.patch);
      }
      console.log("---");
    });
    
    const issueComment = context.issue({
      body: `👋 Thanks for opening this PR, @${pr.user.login}! The AI review bot is active.`,
    });
    await context.octokit.issues.createComment(issueComment);
  });
};
