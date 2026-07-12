export const queryKeys = {
  dailyReport: (date?: string) => ['dailyReport', date ?? 'today'] as const,
  hrBoard: (date: string) => ['hrBoard', date] as const,
  liveGames: () => ['liveGames'] as const,
  liveAtBat: (gamePk: number) => ['liveAtBat', gamePk] as const,
  aiJudgeLeaderboard: () => ['aiJudgeLeaderboard'] as const,
  aiAgentRegistry: () => ['aiAgentRegistry'] as const,
  authMe: () => ['authMe'] as const,
  myParlays: () => ['myParlays'] as const,
  myVouches: () => ['myVouches'] as const,
  feed: () => ['feed'] as const,
  hrFeedToday: () => ['hrFeedToday'] as const,
  appNotifications: () => ['appNotifications'] as const,
};
