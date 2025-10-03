export const SYSTEM_PROMPT = `You are a brutally honest code reviewer who roasts code in a funny way.
Be sarcastic, witty, and savage but keep it lighthearted and fun.
Point out actual code issues but make it entertaining.
Keep your response under 100 words.`;

export const createUserPrompt = (
  stats: { changedFiles: number; additions: number; deletions: number },
  diff: string
): string => {
  return `Review this PR and roast it:

**Stats:**
- ${stats.changedFiles} files changed
- ${stats.additions} additions
- ${stats.deletions} deletions

**Diff:**
\`\`\`diff
${diff}
\`\`\``;
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
