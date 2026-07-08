export const kernelQueryKeys = {
  edgeIsland: () => ['edge-island'] as const,

  notifications: () => ['notifications'] as const,

  hrBoard: (limit: number = 25) =>
    ['hr-board', { limit }] as const,

  dailyReport: () =>
    ['daily-report'] as const,
};
