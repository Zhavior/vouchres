import { useEffect, useState } from 'react';
import { Palette, Tag } from 'lucide-react';
import {
  CHAT_ACCENT_PALETTE,
  loadChatProfile,
  saveChatProfile,
  type ChatAccentColor,
  type ResolvedChatProfile,
  type VouchEdgeChatProfile,
} from '../../lib/chatProfileStorage';
import { apiClient } from '../../lib/apiClient';
import ChatProfileCard from './ChatProfileCard';

type Props = {
  resolved: ResolvedChatProfile;
  isLoggedIn: boolean;
  onChange?: (profile: VouchEdgeChatProfile) => void;
};

export default function ChatProfileEditor({ resolved, isLoggedIn, onChange }: Props) {
  const [draft, setDraft] = useState<VouchEdgeChatProfile>(() => loadChatProfile());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiClient.get<{ chatProfile: VouchEdgeChatProfile | null }>('/api/profile/chat-profile');
        if (cancelled || !data.chatProfile) return;
        const merged = saveChatProfile(data.chatProfile);
        setDraft(merged);
        onChange?.(merged);
      } catch {
        // localStorage remains source when offline
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per login
  }, [isLoggedIn]);

  const preview: ResolvedChatProfile = { ...resolved, ...draft };

  const persist = async (next: VouchEdgeChatProfile) => {
    setDraft(next);
    saveChatProfile(next);
    onChange?.(next);
    if (!isLoggedIn) return;

    setSyncing(true);
    try {
      await apiClient.put('/api/profile/chat-profile', next);
    } catch {
      // local copy already saved
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-3">
      <ChatProfileCard profile={preview} compact />

      <div className="glass-panel glass-border space-y-3 rounded-2xl p-3.5">
        <div>
          <label htmlFor="chat-status-line" className="terminal-text text-white/40">
            Status line
          </label>
          <input
            id="chat-status-line"
            type="text"
            maxLength={80}
            value={draft.statusLine}
            onChange={(e) => void persist({ ...draft, statusLine: e.target.value })}
            placeholder="What are you researching?"
            className="glass-panel glass-border mt-1.5 w-full rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-vouch-cyan/40 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="chat-tag" className="terminal-text flex items-center gap-1 text-white/40">
            <Tag className="h-3 w-3" />
            Chat tag
          </label>
          <input
            id="chat-tag"
            type="text"
            maxLength={32}
            value={draft.tag ?? ''}
            onChange={(e) => void persist({ ...draft, tag: e.target.value })}
            placeholder="HR hunter, parlay lab…"
            className="glass-panel glass-border mt-1.5 w-full rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-vouch-cyan/40 focus:outline-none"
          />
        </div>

        <div>
          <div className="terminal-text mb-2 flex items-center gap-1 text-white/40">
            <Palette className="h-3 w-3" />
            Accent color
          </div>
          <div className="flex flex-wrap gap-2">
            {CHAT_ACCENT_PALETTE.map((color) => (
              <button
                key={color.id}
                type="button"
                aria-label={`Accent ${color.label}`}
                aria-pressed={draft.accentColor === color.id}
                onClick={() => void persist({ ...draft, accentColor: color.id as ChatAccentColor })}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  draft.accentColor === color.id ? 'border-white scale-110' : 'border-white/15 hover:border-white/40'
                }`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>

        {syncing ? (
          <p className="text-center text-[10px] text-white/30">Syncing chat profile…</p>
        ) : null}
      </div>
    </div>
  );
}
