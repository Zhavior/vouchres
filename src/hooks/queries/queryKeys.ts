export const queryKeys = {
  dailyReport: (date?: string) => ['dailyReport', date ?? 'today'] as const,
  hrBoardToday: (previewLimit?: number) => ['hrBoardToday', previewLimit ?? 'default'] as const,
  liveGames: () => ['liveGames'] as const,
  aiJudgeLeaderboard: () => ['aiJudgeLeaderboard'] as const,
};
