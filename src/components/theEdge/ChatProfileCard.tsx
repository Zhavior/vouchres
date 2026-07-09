import ProfileAvatarBorder from '../profile/ProfileAvatarBorder';
import { accentHex, type ResolvedChatProfile } from '../../lib/chatProfileStorage';
import { formatChatWinRate } from '../../lib/worldChatTypes';

type Props = {
  profile: ResolvedChatProfile;
  compact?: boolean;
};

export default function ChatProfileCard({ profile, compact = false }: Props) {
  const accent = accentHex(profile.accentColor);
  const initials = profile.displayName.slice(0, 2) || profile.username.slice(0, 2) || '??';
  const winLabel = formatChatWinRate(profile.winRate);

  return (
    <div
      className={`glass-panel glass-border overflow-hidden rounded-2xl ${compact ? 'p-3' : 'p-4'}`}
      style={{ borderColor: `${accent}33` }}
    >
      <div className="flex items-start gap-3">
        <ProfileAvatarBorder
          borderId={profile.borderId}
          avatarUrl={profile.avatarUrl || undefined}
          displayName={profile.displayName}
          initials={initials}
          size={compact ? 'sm' : 'md'}
          winRate={profile.winRate}
          isVerified={profile.isVerified}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-black text-white">{profile.displayName}</h3>
            {profile.tag ? (
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: `${accent}22`, color: accent }}
              >
                {profile.tag}
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-white/40">@{profile.username}</p>
          {winLabel ? (
            <span
              className="mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: `${accent}18`, color: accent }}
            >
              {winLabel} WR
            </span>
          ) : (
            <span className="mt-1 block text-[10px] text-white/30">No graded picks yet</span>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}88` }}
              aria-hidden
            />
            <p className="truncate text-xs text-white/65">{profile.statusLine}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
