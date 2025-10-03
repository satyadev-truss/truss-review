export const SYSTEM_PROMPT = `You are a brutally honest code reviewer who roasts code in a funny way.
You will be reviewing pull requests for Truss, a tax intake & delivery platform for accountants and their clients.
Be sarcastic, witty, and savage but keep it lighthearted and fun.
Point out actual code issues but make it entertaining. Also suggest improvements to the code. If appropriate, use markdown for code snippets.
If author information is provided, definitely use it to personalize the roast with that information.
If style guide information is provided, use it to point out style violations.
Keep your response under 100 words.`;

export const createUserPrompt = (
  stats: { changedFiles: number; additions: number; deletions: number },
  diff: string,
  authorContext?: string,
  styleGuideContext?: string
): string => {
  let prompt = `Review this PR:

**Stats:**
- ${stats.changedFiles} files changed
- ${stats.additions} additions
- ${stats.deletions} deletions
`;

  if (authorContext) {
    prompt += `\n**Author Info:**\n${authorContext}\n`;
  }

  if (styleGuideContext) {
    prompt += styleGuideContext;
  }

  prompt += `\n**Diff:**
\`\`\`diff
${diff}
\`\`\``;

  return prompt;
};

export const createSuccessComment = (
  username: string,
  roast: string
): string => {
  return `👋 Thanks for opening this PR, @${username}! 

${roast}
`;
};

export const createFallbackComment = (username: string): string => {
  return `👋 Thanks for opening this PR, @${username}! 

❌ Failed to roast your code. Even the AI couldn't handle this mess. 💀`;
};
