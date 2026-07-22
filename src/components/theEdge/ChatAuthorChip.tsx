import ProfileAvatarBorder from '../profile/ProfileAvatarBorder';
import { accentHex, type ChatAccentColor } from '../../lib/chatProfileStorage';
import { formatChatWinRate } from '../../lib/worldChatTypes';

export type ChatAuthor = {
  userId: string;
  displayName: string;
  username: string;
  handle?: string;
  avatarUrl?: string | null;
  borderId?: string | null;
  accentColor?: string;
  winRate?: number | null;
  statusLine?: string;
};

type Props = {
  author: ChatAuthor;
  timestamp?: string;
  onOpenProfile?: (userId: string) => void;
  compact?: boolean;
};

export default function ChatAuthorChip({ author, timestamp, onOpenProfile, compact = false }: Props) {
  const accent = accentHex((author.accentColor as ChatAccentColor) ?? 'cyan');
  const handle = author.handle ?? author.username;
  const winLabel = formatChatWinRate(author.winRate);
  const initials = author.displayName.slice(0, 2) || author.username.slice(0, 2) || '??';
  const canNavigate = Boolean(author.userId && onOpenProfile);

  const openProfile = () => {
    if (author.userId && onOpenProfile) onOpenProfile(author.userId);
  };

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'mb-1'}`}>
      <button
        type="button"
        onClick={openProfile}
        disabled={!canNavigate}
        className={`shrink-0 rounded-full transition ${canNavigate ? 'hover:ring-2 hover:ring-vouch-cyan/40' : 'cursor-default'}`}
        aria-label={canNavigate ? `Open ${author.displayName}'s profile` : author.displayName}
      >
        <ProfileAvatarBorder
          borderId={author.borderId ?? undefined}
          avatarUrl={author.avatarUrl || undefined}
          displayName={author.displayName}
          initials={initials}
          size="sm"
          winRate={author.winRate ?? undefined}
        />
      </button>

      <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <button
          type="button"
          onClick={openProfile}
          disabled={!canNavigate}
          className={`truncate text-xs font-bold transition ${
            canNavigate ? 'text-white hover:text-vouch-cyan' : 'text-white/80 cursor-default'
          }`}
          style={canNavigate ? { color: undefined } : undefined}
        >
          <span style={{ color: canNavigate ? accent : undefined }}>{author.displayName}</span>
        </button>

        <button
          type="button"
          onClick={openProfile}
          disabled={!canNavigate}
          className={`rounded-full border px-1.5 py-0.5 font-mono text-[10px] transition ${
            canNavigate
              ? 'border-white/15 bg-black/30 text-white/50 hover:border-vouch-cyan/35 hover:text-vouch-cyan'
              : 'border-white/10 text-white/35 cursor-default'
          }`}
        >
          @{handle}
        </button>

        {winLabel ? (
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
            style={{ backgroundColor: `${accent}18`, color: accent }}
            title="Verified win rate from graded picks"
          >
            {winLabel} WR
          </span>
        ) : null}

        {timestamp ? (
          <span className="text-[10px] text-white/25">{timestamp}</span>
        ) : null}
      </div>
    </div>
  );
}
