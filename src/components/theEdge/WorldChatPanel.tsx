import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Globe, Lock, Send, Settings2 } from 'lucide-react';
import type { CreatorProofProfile } from '../../types';
import { apiClient } from '../../lib/apiClient';
import {
  loadChatProfile,
  mergeChatProfile,
  type ResolvedChatProfile,
  type VouchEdgeChatProfile,
} from '../../lib/chatProfileStorage';
import type { WorldChatMessage } from '../../lib/worldChatTypes';
import ChatAuthorChip from './ChatAuthorChip';
import ChatProfileCard from './ChatProfileCard';
import ChatProfileEditor from './ChatProfileEditor';

type Props = {
  profile?: CreatorProofProfile;
  isLoggedIn?: boolean;
  onNavigateProfile?: (userId: string) => void;
  onSectionChange?: (section: string) => void;
  onClose?: () => void;
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function WorldChatPanel({
  profile,
  isLoggedIn = false,
  onNavigateProfile,
  onSectionChange,
  onClose,
}: Props) {
  const [messages, setMessages] = useState<WorldChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [chatPrefs, setChatPrefs] = useState<VouchEdgeChatProfile>(() => loadChatProfile());
  const scrollRef = useRef<HTMLDivElement>(null);

  const resolvedProfile: ResolvedChatProfile = useMemo(
    () => mergeChatProfile(profile, chatPrefs),
    [profile, chatPrefs],
  );

  const fetchMessages = useCallback(async () => {
    try {
      const data = await apiClient.get<{ messages: WorldChatMessage[]; preview?: boolean }>(
        '/api/world-chat/messages',
        { limit: 60 },
      );
      setMessages(data.messages ?? []);
      setPreviewMode(Boolean(data.preview) && (data.messages?.length ?? 0) === 0);
      setError(null);
    } catch {
      setMessages([]);
      setPreviewMode(true);
      setError('Could not load world chat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMessages();
    const timer = window.setInterval(() => void fetchMessages(), 12_000);
    return () => window.clearInterval(timer);
  }, [fetchMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handlePost = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || posting || !isLoggedIn) return;

    setPosting(true);
    setInput('');
    try {
      const data = await apiClient.post<{ message: WorldChatMessage }>('/api/world-chat/messages', {
        text,
        accentColor: chatPrefs.accentColor,
        statusLine: chatPrefs.statusLine,
        borderId: resolvedProfile.borderId ?? null,
      });
      if (data.message) {
        setMessages((prev) => [...prev, data.message].slice(-100));
        setPreviewMode(false);
      } else {
        await fetchMessages();
      }
      setError(null);
    } catch (err: any) {
      setInput(text);
      setError(err?.message ?? 'Failed to post message.');
    } finally {
      setPosting(false);
    }
  };

  const signIn = () => {
    onSectionChange?.('welcome');
    onClose?.();
  };

  const openAuthorProfile = (userId: string) => {
    if (userId && onNavigateProfile) onNavigateProfile(userId);
  };

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <div className="glass-panel glass-border mb-3 flex items-center gap-3 rounded-2xl p-3.5">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-vouch-emerald/30 bg-vouch-emerald/10 text-vouch-emerald">
          <Globe className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-white">World Chat</h2>
          <p className="text-[10px] text-white/40">Community lounge · profile-linked messages</p>
        </div>
        {previewMode ? (
          <span className="terminal-text rounded-full border border-white/10 px-2 py-1 text-vouch-amber">Preview</span>
        ) : null}
        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => setShowEditor((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold text-white/50 transition hover:border-vouch-cyan/35 hover:text-vouch-cyan"
          >
            <Settings2 className="h-3 w-3" />
            {showEditor ? 'Done' : 'Edit'}
          </button>
        ) : null}
      </div>

      {isLoggedIn ? (
        showEditor ? (
          <div className="mb-3 shrink-0">
            <ChatProfileEditor
              resolved={resolvedProfile}
              isLoggedIn={isLoggedIn}
              onChange={setChatPrefs}
            />
          </div>
        ) : (
          <div className="mb-3 shrink-0">
            <ChatProfileCard profile={resolvedProfile} compact />
          </div>
        )
      ) : (
        <div className="glass-panel glass-border mb-3 rounded-2xl border-emerald-400/20 bg-emerald-400/[0.06] p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-vouch-emerald" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">Sign in to chat and customize your profile</p>
              <p className="mt-1 text-xs text-white/45">
                World Chat uses your VouchEdge profile — display name, avatar, and tier border on every message.
              </p>
              <button
                type="button"
                onClick={signIn}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-black text-vouch-emerald transition hover:border-emerald-400/50"
              >
                Sign in to join
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="glass-panel glass-border min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl p-3"
      >
        {loading ? (
          <p className="text-center text-xs text-white/35">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-white/40">
            {previewMode
              ? 'No messages yet — be the first to say hello when you sign in.'
              : 'No messages yet. Be the first to share an edge — honest research only.'}
          </p>
        ) : (
          messages.map((msg) => (
            <article key={msg.id} className="rounded-xl border border-white/5 bg-black/20 p-2.5">
              <ChatAuthorChip
                author={{
                  userId: msg.userId,
                  displayName: msg.displayName,
                  username: msg.username,
                  handle: msg.handle,
                  avatarUrl: msg.avatarUrl,
                  borderId: msg.borderId,
                  accentColor: msg.accentColor,
                  winRate: msg.winRate,
                }}
                timestamp={formatTime(msg.createdAt)}
                onOpenProfile={openAuthorProfile}
              />
              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-white/80">{msg.text}</p>
            </article>
          ))
        )}
      </div>

      {error ? <p className="mt-2 text-center text-[11px] text-rose-400/90">{error}</p> : null}

      <form onSubmit={handlePost} className="mt-3 flex shrink-0 gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          disabled={!isLoggedIn || posting}
          placeholder={isLoggedIn ? `Message as @${resolvedProfile.username}…` : 'Sign in to join World Chat'}
          className="glass-panel glass-border min-w-0 flex-1 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-vouch-cyan/40 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!isLoggedIn || posting || !input.trim()}
          className="glass-panel glass-border grid h-10 w-10 shrink-0 place-items-center rounded-xl text-vouch-cyan transition hover:border-vouch-cyan/50 disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      <p className="mt-2 text-center text-[10px] text-white/25">
        Trust-first lounge — no bots, no fake users. Research &amp; entertainment only.
      </p>
    </div>
  );
}
