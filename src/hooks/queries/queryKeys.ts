export const queryKeys = {
  dailyReport: (date?: string) => ['dailyReport', date ?? 'today'] as const,
  hrBoard: (date: string, previewLimit?: number) =>
    ['hrBoard', date, previewLimit ?? 'default'] as const,
  liveGames: () => ['liveGames'] as const,
  aiJudgeLeaderboard: () => ['aiJudgeLeaderboard'] as const,
  aiAgentRegistry: () => ['aiAgentRegistry'] as const,
  authMe: () => ['authMe'] as const,
  myParlays: () => ['myParlays'] as const,
  myVouches: () => ['myVouches'] as const,
  hrFeedToday: () => ['hrFeedToday'] as const,
  appNotifications: () => ['appNotifications'] as const,
};
