import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, CornerUpLeft, ExternalLink, Globe, Loader, Lock, MessageCircle, Send, Settings2, X } from 'lucide-react';
import type { CreatorProofProfile } from '../../types';
import { apiClient } from '../../lib/apiClient';
import { fetchParlayProofRecord } from '../../lib/parlays/fetchParlayProof';
import type { ClientParlayProof } from '../../lib/parlays/parlayProofClient';
import { ensureRealtimeAuth, supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/useAuth';
import { useDirectMessages, useFollowingHub } from '../../hooks/useFollowingHub';
import {
  loadChatProfile,
  mergeChatProfile,
  type ResolvedChatProfile,
  type VouchEdgeChatProfile,
} from '../../lib/chatProfileStorage';
import type {
  WorldChatChannel,
  WorldChatCustomEmoji,
  WorldChatMessage,
  WorldChatReplyRef,
  WorldChatReaction,
} from '../../lib/worldChatTypes';
import ChatAuthorChip, { type ChatAuthor } from './ChatAuthorChip';
import ChatProfileCard from './ChatProfileCard';
import ChatProfileEditor from './ChatProfileEditor';

type Props = {
  profile?: CreatorProofProfile;
  isLoggedIn?: boolean;
  onNavigateProfile?: (userId: string) => void;
  onSectionChange?: (section: string) => void;
  onClose?: () => void;
};

type WorldChatPage = 'world' | 'messages';

const PARLAY_PROOF_LINK_RE =
  /((?:https?:\/\/[^\s]+)?\/p\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}))/gi;

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function extractParlayProofIds(text: string): string[] {
  const ids = new Set<string>();
  for (const match of text.matchAll(PARLAY_PROOF_LINK_RE)) {
    const pickId = String(match[2] ?? '').trim().toLowerCase();
    if (pickId) ids.add(pickId);
  }
  return [...ids];
}

function renderMessageText(text: string) {
  const segments = text.split(PARLAY_PROOF_LINK_RE);
  const nodes: ReactNode[] = [];

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (!segment) continue;

    if (index % 3 === 0) {
      nodes.push(<span key={`text-${index}`}>{segment}</span>);
      continue;
    }

    if (index % 3 === 1) {
      const pickId = String(segments[index + 1] ?? '').trim().toLowerCase();
      if (!pickId) {
        nodes.push(<span key={`text-${index}`}>{segment}</span>);
        continue;
      }
      nodes.push(
        <ParlayProofInlineLink
          key={`proof-${pickId}-${index}`}
          pickId={pickId}
          label={segment}
        />,
      );
    }
  }

  return nodes.length > 0 ? nodes : text;
}

function legPreviewLabel(leg: Record<string, unknown>, index: number): string {
  return String(
    leg.selection ??
      leg.player_name ??
      leg.playerName ??
      leg.market_label ??
      leg.market ??
      `Leg ${index + 1}`,
  );
}

function ParlayProofHoverCard({ proof }: { proof: ClientParlayProof | null }) {
  if (!proof) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#07131f] p-3 text-xs text-white/60 shadow-2xl">
        Could not load that parlay proof preview.
      </div>
    );
  }

  const author = proof.author?.display_name ?? proof.author?.handle ?? proof.author?.username ?? 'VouchEdge';
  const previewLegs = proof.legs.slice(0, 3);

  return (
    <div className="w-[320px] rounded-2xl border border-cyan-400/20 bg-[#07131f] p-3 text-left shadow-2xl backdrop-blur-xl">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300/80">Parlay proof</p>
      <p className="mt-2 line-clamp-2 text-sm font-black text-white">{proof.selection}</p>
      <p className="mt-1 text-[11px] text-white/45">
        by {author} · {proof.legs.length} legs
      </p>
      {previewLegs.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          {previewLegs.map((leg, index) => (
            <p key={`${proof.id}-leg-${index}`} className="line-clamp-1 text-[11px] text-white/72">
              {index + 1}. {legPreviewLabel(leg, index)}
            </p>
          ))}
          {proof.legs.length > previewLegs.length ? (
            <p className="text-[10px] text-white/38">+{proof.legs.length - previewLegs.length} more legs</p>
          ) : null}
        </div>
      ) : null}
      <p className="mt-3 text-[10px] text-cyan-200/70">Click to view it. Tail there. No edits on the shared proof.</p>
    </div>
  );
}

function SharedParlayProofCard({ pickId }: { pickId: string }) {
  const { data: proof, isLoading } = useQuery({
    queryKey: ['world-chat-proof-card', pickId],
    queryFn: () => fetchParlayProofRecord(pickId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="mt-2 rounded-2xl border border-cyan-400/15 bg-cyan-950/10 p-3 text-xs text-cyan-100/70">
        Loading shared parlay proof...
      </div>
    );
  }

  if (!proof) {
    return (
      <a
        href={`/p/${encodeURIComponent(pickId)}`}
        className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-950/10 p-3 text-left transition hover:border-cyan-300/35"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/75">Shared parlay</p>
          <p className="mt-1 text-sm text-white/75">Open proof page</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-cyan-200/75" />
      </a>
    );
  }

  const author = proof.author?.display_name ?? proof.author?.handle ?? proof.author?.username ?? 'VouchEdge';
  const previewLegs = proof.legs.slice(0, 2);

  return (
    <a
      href={`/p/${encodeURIComponent(pickId)}`}
      className="mt-2 block rounded-2xl border border-cyan-400/15 bg-cyan-950/10 p-3 transition hover:border-cyan-300/35 hover:bg-cyan-950/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/75">Shared parlay</p>
          <p className="mt-1 line-clamp-2 text-sm font-black text-white">{proof.selection}</p>
          <p className="mt-1 text-[11px] text-white/50">
            by {author} · {proof.legs.length} legs
          </p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-cyan-200/75" />
      </div>
      {previewLegs.length > 0 ? (
        <div className="mt-3 space-y-1.5 border-t border-white/8 pt-3">
          {previewLegs.map((leg, index) => (
            <p key={`${pickId}-shared-${index}`} className="line-clamp-1 text-[11px] text-white/72">
              {index + 1}. {legPreviewLabel(leg, index)}
            </p>
          ))}
          {proof.legs.length > previewLegs.length ? (
            <p className="text-[10px] text-white/38">+{proof.legs.length - previewLegs.length} more legs</p>
          ) : null}
        </div>
      ) : null}
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200/65">
        Open proof · tail on your profile
      </p>
    </a>
  );
}

function ParlayProofInlineLink({ pickId, label }: { pickId: string; label: string }) {
  const [hovered, setHovered] = useState(false);
  const { data: proof } = useQuery({
    queryKey: ['world-chat-proof-preview', pickId],
    queryFn: () => fetchParlayProofRecord(pickId),
    enabled: hovered,
    staleTime: 60_000,
  });

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <a
        href={`/p/${encodeURIComponent(pickId)}`}
        className="inline-flex items-center gap-1 font-semibold text-cyan-300 underline decoration-cyan-400/50 underline-offset-2 transition hover:text-cyan-200"
      >
        <span>{label}</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      </a>
      {hovered ? (
        <div className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden sm:block">
          <ParlayProofHoverCard proof={proof ?? null} />
        </div>
      ) : null}
    </span>
  );
}

type SocialProfilePreview = ChatAuthor & {
  statusLine?: string;
};

function SocialProfilePreviewSheet({
  profile,
  isOwnProfile,
  onClose,
  onOpenFullProfile,
  onToggleFollow,
  onMessageProfile,
}: {
  profile: SocialProfilePreview;
  isOwnProfile: boolean;
  onClose: () => void;
  onOpenFullProfile: () => void;
  onToggleFollow: () => void;
  onMessageProfile: () => void;
}) {
  const { data: stats } = useQuery({
    queryKey: ['world-chat-profile-stats', profile.userId],
    queryFn: () => apiClient.get<{ followers: number; following: number; friends: number; subscribers: number; tailing: number; posts: number }>(
      `/api/profile/${encodeURIComponent(profile.userId)}/stats`,
    ),
    staleTime: 60_000,
  });
  const { user } = useAuth();
  const { data: relationship, refetch: refetchRelationship, isFetching: relationshipBusy } = useQuery({
    queryKey: ['world-chat-profile-relationship', profile.userId, user?.id ?? 'guest'],
    queryFn: () => apiClient.get<{ isFollowing: boolean; relationshipType: 'follow' | 'tail' | 'subscribe' | null; notifyEnabled: boolean; isFriend: boolean }>(
      '/api/social/relationship',
      { profile_id: profile.userId },
    ),
    enabled: Boolean(user?.id) && !isOwnProfile,
    staleTime: 30_000,
  });

  const followLabel = relationship?.isFollowing ? 'Following' : 'Follow';

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/55 p-3 sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#08111b] p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">SocialOS profile</p>
            <h3 className="mt-1 text-lg font-black text-white">{profile.displayName}</h3>
            <p className="text-sm text-white/45">@{profile.handle ?? profile.username}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-1 text-white/45 transition hover:border-white/20 hover:text-white/80"
            aria-label="Close profile preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <ChatAuthorChip author={profile} compact />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Followers</p>
            <p className="mt-1 text-sm font-black text-white">{stats?.followers ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Following</p>
            <p className="mt-1 text-sm font-black text-white">{stats?.following ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Tailing</p>
            <p className="mt-1 text-sm font-black text-white">{stats?.tailing ?? '—'}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Status</p>
          <p className="mt-1 text-sm text-white/70">{profile.statusLine || 'Researching edges'}</p>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onOpenFullProfile}
            className="flex-1 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-200 transition hover:border-cyan-300/55"
          >
            Open full profile
          </button>
          {!isOwnProfile && user?.id ? (
            <button
              type="button"
              onClick={onMessageProfile}
              className="rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/75 transition hover:border-white/25 hover:text-white"
            >
              Message
            </button>
          ) : null}
          {!isOwnProfile && user?.id ? (
            <button
              type="button"
              onClick={() => {
                void onToggleFollow();
                void refetchRelationship();
              }}
              disabled={relationshipBusy}
              className="rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/75 transition hover:border-white/25 hover:text-white disabled:opacity-50"
            >
              {followLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function WorldChatPanel({
  profile,
  isLoggedIn = false,
  onNavigateProfile,
  onSectionChange,
  onClose,
}: Props) {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState<WorldChatPage>('world');
  const [messages, setMessages] = useState<WorldChatMessage[]>([]);
  const [channels, setChannels] = useState<WorldChatChannel[]>([]);
  const [emojis, setEmojis] = useState<WorldChatCustomEmoji[]>([]);
  const [blockedTerms, setBlockedTerms] = useState<string[]>([]);
  const [activeChannelId, setActiveChannelId] = useState('world:lounge');
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [posting, setPosting] = useState(false);
  const [reactingKey, setReactingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<WorldChatReplyRef | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<SocialProfilePreview | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [chatPrefs, setChatPrefs] = useState<VouchEdgeChatProfile>(() => loadChatProfile());
  const [dmDraft, setDmDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const dm = useDirectMessages(Boolean(isLoggedIn && activePage === 'messages'));
  const followingHub = useFollowingHub(Boolean(isLoggedIn && activePage === 'messages'));

  const resolvedProfile: ResolvedChatProfile = useMemo(
    () => mergeChatProfile(profile, chatPrefs),
    [profile, chatPrefs],
  );

  const fetchMessages = useCallback(async () => {
    try {
      const data = await apiClient.get<{
        messages: WorldChatMessage[];
        channels?: WorldChatChannel[];
        emojis?: WorldChatCustomEmoji[];
        blockedTerms?: string[];
        preview?: boolean;
      }>('/api/world-chat/messages', {
        limit: 60,
        channelId: activeChannelId,
      });

      const nextChannels = data.channels ?? [];
      const nextEmojis = (data.emojis ?? []).filter((emoji) => emoji.isActive);
      setMessages(data.messages ?? []);
      setChannels(nextChannels);
      setEmojis(nextEmojis);
      setBlockedTerms(data.blockedTerms ?? []);
      setPreviewMode(Boolean(data.preview) && (data.messages?.length ?? 0) === 0);
      setError(null);

      if (nextChannels.length > 0 && !nextChannels.some((channel) => channel.id === activeChannelId)) {
        const fallbackChannel = nextChannels.find((channel) => channel.isDefault) ?? nextChannels[0];
        if (fallbackChannel) setActiveChannelId(fallbackChannel.id);
      }
    } catch {
      setMessages([]);
      setChannels([]);
      setEmojis([]);
      setBlockedTerms([]);
      setPreviewMode(true);
      setError('Could not load world chat.');
    } finally {
      setLoading(false);
    }
  }, [activeChannelId]);

  useEffect(() => {
    void fetchMessages();
    const timer = window.setInterval(() => void fetchMessages(), isLoggedIn ? 30_000 : 12_000);
    return () => window.clearInterval(timer);
  }, [fetchMessages, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || activePage !== 'world') return;

    let disposed = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void (async () => {
      await ensureRealtimeAuth();
      if (disposed) return;

      channel = supabase
        .channel(`world-chat-live:${activeChannelId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'world_chat_messages',
            filter: `channel_id=eq.${activeChannelId}`,
          },
          () => void fetchMessages(),
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'world_chat_message_reactions' },
          () => void fetchMessages(),
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'world_chat_custom_emojis' },
          () => void fetchMessages(),
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'world_chat_channels' },
          () => void fetchMessages(),
        )
        .subscribe();
    })();

    return () => {
      disposed = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [activeChannelId, activePage, fetchMessages, isLoggedIn]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    setReplyTarget(null);
  }, [activeChannelId]);

  const handlePost = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || posting || !isLoggedIn) return;

    const normalized = ` ${text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')} `;
    const blockedTerm = blockedTerms.find((term) => normalized.includes(` ${term.toLowerCase()} `));
    if (blockedTerm) {
      setError('World Chat blocked that message. Remove the blocked word and try again.');
      return;
    }

    setPosting(true);
    setInput('');
    try {
      const data = await apiClient.post<{ message: WorldChatMessage }>('/api/world-chat/messages', {
        text,
        channelId: activeChannelId,
        replyToMessageId: replyTarget?.id ?? null,
        accentColor: chatPrefs.accentColor,
        statusLine: chatPrefs.statusLine,
        borderId: resolvedProfile.borderId ?? null,
      });
      if (data.message) {
        setMessages((prev) => [...prev, data.message].slice(-100));
        setPreviewMode(false);
        setReplyTarget(null);
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

  const handleReaction = async (messageId: string, emojiId: string) => {
    if (!isLoggedIn || reactingKey) return;
    const key = `${messageId}:${emojiId}`;
    setReactingKey(key);
    try {
      const data = await apiClient.post<{ messageId: string; reactions: WorldChatReaction[] }>(
        '/api/world-chat/reactions',
        { messageId, emojiId },
      );
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, reactions: data.reactions ?? [] } : message,
        ),
      );
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update reaction.');
    } finally {
      setReactingKey(null);
    }
  };

  const signIn = () => {
    onSectionChange?.('welcome');
    onClose?.();
  };

  const openAuthorProfile = (userId: string) => {
    if (userId && onNavigateProfile) onNavigateProfile(userId);
  };

  const openAuthorPreview = (author: SocialProfilePreview) => {
    setSelectedProfile(author);
  };

  const handleToggleFollow = async () => {
    if (!selectedProfile || !user?.id || selectedProfile.userId === user.id) return;
    try {
      const relationship = await apiClient.get<{ isFollowing: boolean }>(
        '/api/social/relationship',
        { profile_id: selectedProfile.userId },
      );
      if (relationship.isFollowing) {
        await apiClient.delete('/api/follow', { following_profile_id: selectedProfile.userId });
      } else {
        await apiClient.post('/api/follow', {
          following_profile_id: selectedProfile.userId,
          relationship_type: 'follow',
          notify_enabled: true,
        });
      }
    } catch (err: any) {
      setError(err?.message ?? 'Could not update follow state.');
    }
  };

  const handleMessageProfile = async (userId: string) => {
    try {
      setActivePage('messages');
      setSelectedProfile(null);
      await dm.startConversation(userId);
    } catch (err: any) {
      setError(err?.message ?? 'Could not start a message.');
    }
  };

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) ?? null;
  const sharedProofIdsInDraft = useMemo(() => extractParlayProofIds(input), [input]);

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <div className="glass-panel glass-border mb-3 flex items-center gap-3 rounded-2xl p-3.5">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-vouch-emerald/30 bg-vouch-emerald/10 text-vouch-emerald">
          <Globe className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-white">World Chat</h2>
          <p className="text-[10px] text-white/40">
            {activeChannel?.description ?? 'Community lounge · profile-linked messages'}
          </p>
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

      <div className="mb-3 flex gap-2">
        {([
          { id: 'world', label: 'World' },
          { id: 'messages', label: 'Messages' },
        ] as const).map((page) => {
          const active = activePage === page.id;
          const showUnreadBadge = page.id === 'messages' && dm.unreadCount > 0;
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => setActivePage(page.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                active
                  ? 'border-vouch-emerald/50 bg-vouch-emerald/10 text-vouch-emerald'
                  : 'border-white/10 bg-black/20 text-white/50 hover:border-white/25 hover:text-white/80'
              }`}
            >
              {page.label}
              {showUnreadBadge ? (
                <span className="rounded-full border border-vouch-emerald/35 bg-vouch-emerald/15 px-1.5 py-0.5 text-[10px] font-black leading-none text-vouch-emerald">
                  {dm.unreadCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {activePage === 'world' && channels.length > 0 ? (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {channels.map((channel) => {
            const active = channel.id === activeChannelId;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => setActiveChannelId(channel.id)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                  active
                    ? 'border-vouch-cyan/50 bg-vouch-cyan/10 text-vouch-cyan'
                    : 'border-white/10 bg-black/20 text-white/50 hover:border-white/25 hover:text-white/80'
                }`}
              >
                {channel.name}
              </button>
            );
          })}
        </div>
      ) : null}

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

      {activePage === 'world' ? (
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
                onOpenProfile={() => openAuthorPreview({
                  userId: msg.userId,
                  displayName: msg.displayName,
                  username: msg.username,
                  handle: msg.handle,
                  avatarUrl: msg.avatarUrl,
                  borderId: msg.borderId,
                  accentColor: msg.accentColor,
                  winRate: msg.winRate,
                  statusLine: msg.statusLine,
                })}
              />
              <div className="mt-1.5 whitespace-pre-wrap break-words text-sm text-white/80">
                {renderMessageText(msg.text)}
              </div>
              {msg.replyTo ? (
                <button
                  type="button"
                  onClick={() => openAuthorPreview({
                    userId: msg.replyTo!.userId,
                    displayName: msg.replyTo!.displayName,
                    username: msg.replyTo!.handle,
                    handle: msg.replyTo!.handle,
                    winRate: null,
                    statusLine: 'From World Chat reply',
                  })}
                  className="mt-2 block w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-left transition hover:border-white/15"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/65">
                    Replying to @{msg.replyTo.handle}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-white/55">{msg.replyTo.text}</p>
                </button>
              ) : null}
              {extractParlayProofIds(msg.text).length > 0 ? (
                <div className="mt-2 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/60">
                    Shared proof link · open to tail on your own profile
                  </p>
                  {extractParlayProofIds(msg.text).map((pickId) => (
                    <SharedParlayProofCard key={`${msg.id}:${pickId}`} pickId={pickId} />
                  ))}
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setReplyTarget({
                    id: msg.id,
                    userId: msg.userId,
                    displayName: msg.displayName,
                    handle: msg.handle,
                    text: msg.text,
                  })}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-white/55 transition hover:border-white/25 hover:text-white/85"
                >
                  <CornerUpLeft className="h-3.5 w-3.5" />
                  Reply
                </button>
                {emojis.length > 0
                  ? emojis.map((emoji) => {
                      const reaction = msg.reactions.find((item) => item.emojiId === emoji.id);
                      const selected = Boolean(reaction?.reactedByViewer);
                      const count = reaction?.count ?? 0;
                      const disabled = !isLoggedIn || reactingKey === `${msg.id}:${emoji.id}`;
                      return (
                        <button
                          key={`${msg.id}:${emoji.id}`}
                          type="button"
                          disabled={disabled}
                          onClick={() => void handleReaction(msg.id, emoji.id)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] transition ${
                            selected
                              ? 'border-vouch-cyan/45 bg-vouch-cyan/10 text-vouch-cyan'
                              : 'border-white/10 bg-black/20 text-white/55 hover:border-white/25 hover:text-white/85'
                          } disabled:opacity-50`}
                          title={emoji.altText}
                        >
                          <img
                            src={emoji.imageUrl}
                            alt={emoji.altText}
                            className="h-4 w-4 rounded-sm object-cover"
                          />
                          {count > 0 ? <span>{count}</span> : null}
                        </button>
                      );
                    })
                  : null}
              </div>
              </article>
            ))
          )}
        </div>
      ) : (
        <div className="glass-panel glass-border min-h-0 flex-1 overflow-hidden rounded-2xl">
          {!isLoggedIn ? (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <MessageCircle className="mx-auto h-8 w-8 text-white/40" />
                <p className="mt-3 text-sm font-bold text-white">Sign in to open messages</p>
                <p className="mt-1 text-xs text-white/45">Your direct messages live in a separate inbox page inside World Chat.</p>
              </div>
            </div>
          ) : (
            <div className="grid h-full min-h-[420px] lg:grid-cols-[260px_1fr]">
              <div className="border-b border-white/10 lg:border-b-0 lg:border-r">
                <div className="border-b border-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">Inbox</h3>
                      <p className="mt-1 text-[11px] text-white/40">Direct messages from your SocialOS circle.</p>
                    </div>
                    {dm.unreadCount > 0 ? (
                      <span className="rounded-full border border-vouch-emerald/30 bg-vouch-emerald/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-vouch-emerald">
                        {dm.unreadCount} new
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="max-h-[220px] overflow-y-auto border-b border-white/10 p-3">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Start a message</p>
                  {followingHub.loading ? (
                    <div className="flex items-center gap-2 text-xs text-white/45">
                      <Loader className="h-3.5 w-3.5 animate-spin" />
                      Loading your circle...
                    </div>
                  ) : followingHub.people.filter((person) => !person.isSelf).length === 0 ? (
                    <p className="text-xs text-white/45">Follow people to open DMs here.</p>
                  ) : (
                    <div className="space-y-2">
                      {followingHub.people
                        .filter((person) => !person.isSelf)
                        .slice(0, 8)
                        .map((person) => (
                          <button
                            key={`starter:${person.userId}`}
                            type="button"
                            onClick={() => void dm.startConversation(person.userId)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 text-left transition hover:border-white/20"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-white">{person.displayName}</p>
                              <p className="truncate text-[11px] text-white/40">@{person.username}</p>
                            </div>
                            <MessageCircle className="h-3.5 w-3.5 shrink-0 text-white/35" />
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <div className="max-h-[260px] overflow-y-auto">
                  {dm.loading ? (
                    <div className="flex items-center gap-2 p-4 text-sm text-white/45">
                      <Loader className="h-4 w-4 animate-spin" />
                      Loading inbox...
                    </div>
                  ) : dm.conversations.length === 0 ? (
                    <p className="p-4 text-sm text-white/45">No conversations yet. Start with someone from your circle.</p>
                  ) : (
                    dm.conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => void dm.openConversation(conversation.id)}
                        className={`w-full border-b border-white/[0.05] px-4 py-3 text-left transition hover:bg-white/[0.03] ${
                          dm.activeConversationId === conversation.id ? 'bg-white/[0.04]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={`truncate text-sm font-bold ${
                                  conversation.unread ? 'text-white' : 'text-white/88'
                                }`}
                              >
                                {conversation.displayName}
                              </p>
                              {conversation.unread ? <span className="h-2 w-2 rounded-full bg-vouch-emerald" /> : null}
                            </div>
                            <p
                              className={`truncate text-xs ${
                                conversation.unread ? 'text-white/72' : 'text-white/45'
                              }`}
                            >
                              {conversation.lastMessage ? String(conversation.lastMessage.body ?? 'Start chatting') : 'Start chatting'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="flex min-h-[420px] flex-col">
                {dm.activeConversationId ? (
                  <>
                    <div className="border-b border-white/10 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300/70">
                        Active conversation
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {dm.activeConversation?.displayName ?? 'Conversation'}
                          </p>
                          <p className="truncate text-[11px] text-white/45">
                            @{dm.activeConversation?.username ?? 'member'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => dm.setActiveConversationId(null)}
                          className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold text-white/55 transition hover:border-white/25 hover:text-white/85"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                      {dm.messages.length === 0 ? (
                        <p className="text-sm text-white/45">No messages yet. Say hello.</p>
                      ) : (
                        dm.messages.map((message) => {
                          const isMine = message.sender_id === user?.id;
                          return (
                            <div
                              key={message.id}
                              className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                                isMine
                                  ? 'ml-auto border border-vouch-cyan/20 bg-vouch-cyan/15 text-white'
                                  : 'mr-auto border border-white/10 bg-black/30 text-white/85'
                              }`}
                            >
                              <p>{message.body}</p>
                              <p className="mt-1 text-[10px] text-white/35">
                                {formatTime(message.created_at)}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const body = dmDraft.trim();
                        if (!body) return;
                        void dm.sendMessage(body).then(() => setDmDraft(''));
                      }}
                      className="flex gap-2 border-t border-white/10 p-4"
                    >
                      <input
                        value={dmDraft}
                        onChange={(event) => setDmDraft(event.target.value)}
                        placeholder="Write a message..."
                        className="glass-panel glass-border min-w-0 flex-1 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-vouch-cyan/40 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!dmDraft.trim()}
                        className="glass-panel glass-border grid h-10 w-10 shrink-0 place-items-center rounded-xl text-vouch-cyan transition hover:border-vouch-cyan/50 disabled:opacity-40"
                        aria-label="Send direct message"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center p-8 text-center">
                    <div>
                      <MessageCircle className="mx-auto h-8 w-8 text-white/40" />
                      <p className="mt-3 text-sm font-bold text-white">Open a conversation</p>
                      <p className="mt-1 text-xs text-white/45">Pick someone from your circle or inbox to start messaging.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error ? <p className="mt-2 text-center text-[11px] text-rose-400/90">{error}</p> : null}

      {activePage === 'world' && sharedProofIdsInDraft.length > 0 ? (
        <div className="mt-3 rounded-2xl border border-cyan-400/15 bg-cyan-950/10 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/70">
            Proof link detected
          </p>
          <p className="mt-1 text-xs text-white/55">
            This will send as a shared parlay link with a preview card in chat.
          </p>
        </div>
      ) : null}

      {activePage === 'world' && replyTarget ? (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/70">
              Replying to @{replyTarget.handle}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-white/55">{replyTarget.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setReplyTarget(null)}
            className="rounded-full border border-white/10 p-1 text-white/45 transition hover:border-white/20 hover:text-white/75"
            aria-label="Cancel reply"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {activePage === 'world' ? (
        <>
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
        </>
      ) : (
        <p className="mt-2 text-center text-[10px] text-white/25">
          Private messages for your SocialOS circle.
        </p>
      )}
      {selectedProfile ? (
        <SocialProfilePreviewSheet
          profile={selectedProfile}
          isOwnProfile={Boolean(user?.id && selectedProfile.userId === user.id)}
          onClose={() => setSelectedProfile(null)}
          onOpenFullProfile={() => {
            openAuthorProfile(selectedProfile.userId);
            setSelectedProfile(null);
          }}
          onToggleFollow={handleToggleFollow}
          onMessageProfile={() => void handleMessageProfile(selectedProfile.userId)}
        />
      ) : null}
    </div>
  );
}
