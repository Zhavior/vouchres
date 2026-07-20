export interface WorldChatReaction {
  emojiId: string;
  shortcode: string;
  imageUrl: string;
  altText: string;
  count: number;
  reactedByViewer: boolean;
}

export interface WorldChatChannel {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
}

export interface WorldChatCustomEmoji {
  id: string;
  shortcode: string;
  imageUrl: string;
  altText: string;
  isActive: boolean;
  sortOrder: number;
}

export interface WorldChatReplyRef {
  id: string;
  userId: string;
  displayName: string;
  handle: string;
  text: string;
}

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
  channelId: string;
  text: string;
  createdAt: string;
  replyTo: WorldChatReplyRef | null;
  reactions: WorldChatReaction[];
}

export function formatChatWinRate(winRate: number | null | undefined): string | null {
  if (winRate == null || !Number.isFinite(winRate)) return null;
  return `${winRate.toFixed(1)}%`;
}
