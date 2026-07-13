export interface MessagingParticipant {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ConversationSummary {
  id: string;
  otherParticipant: MessagingParticipant;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}
