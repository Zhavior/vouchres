import { useState } from 'react';
import { ChevronDown, MessageCircle, MessageSquare, Radio } from 'lucide-react';
import type { CreatorProofProfile } from '../../types';
import { useAuth } from '../../lib/useAuth';
import WorldChatPanel from './WorldChatPanel';
import ConversationList from '../../social/messaging/ConversationList';
import DirectMessageThread from '../../social/messaging/DirectMessageThread';
import type { ConversationSummary } from '../../lib/messagingTypes';

type Props = {
  profile: CreatorProofProfile;
  isLoggedIn: boolean;
  onNavigateProfile: (userId: string) => void;
  onSectionChange: (section: string) => void;
};

type IslandTab = 'world_chat' | 'messages';

export default function EdgeCommandIsland({
  profile,
  isLoggedIn,
  onNavigateProfile,
  onSectionChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<IslandTab>('world_chat');
  const [activeConversation, setActiveConversation] = useState<ConversationSummary | null>(null);
  const { user } = useAuth();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] inline-flex items-center gap-2 rounded-2xl border border-vouch-cyan/35 bg-[var(--ve-glass-chip)]/95 px-3.5 py-3 text-left shadow-[0_18px_52px_rgba(0,0,0,0.52)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-vouch-cyan/65"
        aria-label="Open Edge Command Island"
      >
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-vouch-cyan/15 text-vouch-cyan">
          <Radio className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-vouch-cyan">Edge</span>
          <span className="block text-xs font-semibold text-white/75">Community chat</span>
        </span>
        <span className="ml-1 h-2 w-2 rounded-full bg-vouch-emerald shadow-[0_0_12px_rgba(0,255,148,0.9)]" />
      </button>
    );
  }

  return (
    <aside className="fixed bottom-4 right-4 z-[80] flex h-[min(560px,calc(100dvh-2rem))] w-[min(380px,calc(100vw-2rem))] flex-col rounded-3xl border border-white/10 bg-[var(--ve-glass-island)]/95 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.68)] backdrop-blur-2xl">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="inline-flex items-center gap-2 text-xs font-black text-white">
          <MessageCircle className="h-4 w-4 text-vouch-cyan" />
          Edge Command Island
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-white/45 hover:bg-white/[0.06] hover:text-white"
          aria-label="Minimize Edge Command Island"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/25 p-1">
        <button
          type="button"
          onClick={() => setTab('world_chat')}
          className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition ${
            tab === 'world_chat' ? 'bg-vouch-cyan/15 text-vouch-cyan' : 'text-white/40 hover:text-white/70'
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          World Chat
        </button>
        <button
          type="button"
          onClick={() => setTab('messages')}
          className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition ${
            tab === 'messages' ? 'bg-vouch-cyan/15 text-vouch-cyan' : 'text-white/40 hover:text-white/70'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Messages
        </button>
      </div>

      {tab === 'world_chat' ? (
        <WorldChatPanel
          compact
          profile={profile}
          isLoggedIn={isLoggedIn}
          onNavigateProfile={onNavigateProfile}
          onSectionChange={onSectionChange}
          onClose={() => setOpen(false)}
        />
      ) : !isLoggedIn || !user ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <MessageSquare className="h-7 w-7 text-white/20" />
          <p className="text-xs text-white/40">Sign in to view your messages.</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10">
          {activeConversation ? (
            <DirectMessageThread
              conversation={activeConversation}
              currentUserId={user.id}
              onBack={() => setActiveConversation(null)}
              compact
            />
          ) : (
            <div className="h-full overflow-y-auto">
              <ConversationList
                activeConversationId={null}
                onSelect={(conversation) => setActiveConversation(conversation)}
                compact
              />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSectionChange('messages');
                }}
                className="mx-2 mb-2 block w-[calc(100%-1rem)] rounded-lg border border-white/10 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-white/50 hover:border-vouch-cyan/35 hover:text-white"
              >
                Open full Messages page
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
