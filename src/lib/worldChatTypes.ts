/** World Chat message shape from GET /api/world-chat/messages */
export interface WorldChatMessage {
  id: string;
  userId: string;
  username: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  borderId: string | null;
  accentColor: string;
  statusLine: string;
  winRate: number | null;
  profilePath: string;
  text: string;
  createdAt: string;
}

export function formatChatWinRate(winRate: number | null | undefined): string | null {
  if (winRate == null || !Number.isFinite(winRate)) return null;
  return `${winRate.toFixed(1)}%`;
}
