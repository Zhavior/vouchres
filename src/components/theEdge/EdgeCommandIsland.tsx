import { useState } from 'react';
import { ChevronDown, MessageCircle, Radio } from 'lucide-react';
import type { CreatorProofProfile } from '../../types';
import WorldChatPanel from './WorldChatPanel';

type Props = {
  profile: CreatorProofProfile;
  isLoggedIn: boolean;
  onNavigateProfile: (userId: string) => void;
  onSectionChange: (section: string) => void;
};

export default function EdgeCommandIsland({
  profile,
  isLoggedIn,
  onNavigateProfile,
  onSectionChange,
}: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] inline-flex items-center gap-2 rounded-2xl border border-vouch-cyan/35 bg-[#07111a]/95 px-3.5 py-3 text-left shadow-[0_18px_52px_rgba(0,0,0,0.52)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-vouch-cyan/65"
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
    <aside className="fixed bottom-4 right-4 z-[80] flex h-[min(560px,calc(100dvh-2rem))] w-[min(380px,calc(100vw-2rem))] flex-col rounded-3xl border border-white/10 bg-[#050a10]/95 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.68)] backdrop-blur-2xl">
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
      <WorldChatPanel
        compact
        profile={profile}
        isLoggedIn={isLoggedIn}
        onNavigateProfile={onNavigateProfile}
        onSectionChange={onSectionChange}
        onClose={() => setOpen(false)}
      />
    </aside>
  );
}
