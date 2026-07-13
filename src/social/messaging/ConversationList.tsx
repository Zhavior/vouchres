import { MessageCircle } from 'lucide-react';
import { useConversations } from '../../hooks/queries/useMessaging';
import type { ConversationSummary } from '../../lib/messagingTypes';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function ConversationList({
  activeConversationId,
  onSelect,
  compact = false,
}: {
  activeConversationId: string | null;
  onSelect: (conversation: ConversationSummary) => void;
  compact?: boolean;
}) {
  const query = useConversations();
  const conversations = query.data?.conversations ?? [];

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <MessageCircle className="h-8 w-8 text-white/20" />
        <p className="text-xs text-white/40">No conversations yet.</p>
        <p className="max-w-[220px] text-[11px] text-white/25">Open a profile and tap Message to start one.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto">
      {conversations.map((conversation) => {
        const isActive = conversation.id === activeConversationId;
        return (
          <button
            key={conversation.id}
            type="button"
            onClick={() => onSelect(conversation)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
              isActive ? 'bg-vouch-cyan/10' : 'hover:bg-white/[0.04]'
            }`}
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] text-xs font-black text-white/70">
              {conversation.otherParticipant.avatarUrl ? (
                <img src={conversation.otherParticipant.avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                initials(conversation.otherParticipant.displayName)
              )}
              {conversation.unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-vouch-cyan px-1 text-[9px] font-black text-black">
                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <strong className={`truncate text-sm ${conversation.unreadCount > 0 ? 'text-white' : 'text-white/80'}`}>
                  {conversation.otherParticipant.displayName}
                </strong>
                <span className="shrink-0 text-[10px] text-white/30">{timeAgo(conversation.lastMessageAt)}</span>
              </span>
              {!compact && (
                <span className={`block truncate text-xs ${conversation.unreadCount > 0 ? 'text-white/60' : 'text-white/35'}`}>
                  {conversation.lastMessagePreview || 'No messages yet'}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
