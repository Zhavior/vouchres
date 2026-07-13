import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useConversationMessages, useSendDirectMessage, useMarkConversationRead } from '../../hooks/queries/useMessaging';
import type { ConversationSummary } from '../../lib/messagingTypes';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function DirectMessageThread({
  conversation,
  currentUserId,
  onBack,
  compact = false,
}: {
  conversation: ConversationSummary;
  currentUserId: string;
  onBack?: () => void;
  compact?: boolean;
}) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesQuery = useConversationMessages(conversation.id);
  const sendMessage = useSendDirectMessage(conversation.id);
  const markRead = useMarkConversationRead();
  const messages = messagesQuery.data?.messages ?? [];

  useEffect(() => {
    if (conversation.unreadCount > 0) {
      markRead.mutate(conversation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || sendMessage.isPending) return;
    setInput('');
    sendMessage.mutate(text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2.5">
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back to conversations" className="rounded-lg p-1.5 text-white/45 hover:bg-white/[0.06] hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] text-[10px] font-black text-white/70">
          {conversation.otherParticipant.avatarUrl ? (
            <img src={conversation.otherParticipant.avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            conversation.otherParticipant.displayName.slice(0, 2).toUpperCase()
          )}
        </span>
        <strong className="truncate text-sm text-white">{conversation.otherParticipant.displayName}</strong>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {messagesQuery.isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-8 w-2/3 animate-pulse rounded-xl bg-white/[0.04]" />)}
          </div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-white/35">Say hello — messages here are private between you two.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((message) => {
              const mine = message.senderId === currentUserId;
              return (
                <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-vouch-cyan/15 text-white' : 'bg-white/[0.06] text-white/85'}`}>
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    <span className="mt-1 block text-right text-[9px] text-white/30">{formatTime(message.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex shrink-0 items-center gap-2 border-t border-white/10 p-2.5">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Write a message…"
          maxLength={2000}
          className="min-h-11 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/30 focus:border-vouch-cyan/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || sendMessage.isPending}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-vouch-cyan/40 bg-vouch-cyan/10 text-vouch-cyan transition hover:bg-vouch-cyan/20 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      {!compact && sendMessage.isError && (
        <p className="px-3 pb-2 text-[11px] text-rose-300">Message failed to send. Try again.</p>
      )}
    </div>
  );
}
