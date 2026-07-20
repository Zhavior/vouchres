import { useState } from 'react';

export interface PlayerIdentityChip {
  label: string;
  tone?: 'neutral' | 'positive' | 'caution';
}

export interface PlayerIdentityHeaderProps {
  name: string;
  avatarUrl?: string | null;
  /** Team accent hue (0-360) used for the initials fallback tint. */
  teamHue?: number;
  team: string;
  teamLogoUrl?: string | null;
  opponent: string;
  opponentLogoUrl?: string | null;
  /** e.g. "vs Yoshinobu Yamamoto" */
  subtitle?: string | null;
  /** e.g. "Yankee Stadium · 1:15 PM" */
  meta?: string | null;
  tierLabel?: string;
  tierColor?: string;
  chips?: PlayerIdentityChip[];
  size?: 'compact' | 'full';
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const CHIP_TONE: Record<NonNullable<PlayerIdentityChip['tone']>, string> = {
  neutral: 'text-white/60 ring-white/20 bg-white/[0.03]',
  positive: 'text-[hsl(var(--ve-positive))] ring-[hsl(var(--ve-positive)/0.3)] bg-[hsl(var(--ve-positive)/0.10)]',
  caution: 'text-[hsl(var(--ve-caution))] ring-[hsl(var(--ve-caution)/0.3)] bg-[hsl(var(--ve-caution)/0.10)]',
};

/**
 * The canonical "who is this, and against whom" header for any player
 * decision surface — HR board, Player Edge Lab, Daily Players, Research,
 * Live Games. Domain-neutral: takes plain strings/urls, no sport-specific
 * scoring fields.
 */
export function PlayerIdentityHeader({
  name,
  avatarUrl,
  teamHue = 200,
  team,
  teamLogoUrl,
  opponent,
  opponentLogoUrl,
  subtitle,
  meta,
  tierLabel,
  tierColor = 'hsl(var(--ve-accent))',
  chips = [],
  size = 'full',
  className = '',
}: PlayerIdentityHeaderProps) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = !!avatarUrl && !imgErr;
  const avatarSize = size === 'compact' ? 'h-14 w-14' : 'h-20 w-20 lg:h-24 lg:w-24';

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="relative shrink-0">
        <div
          className={`flex ${avatarSize} items-center justify-center overflow-hidden rounded-2xl shadow-2xl ring-2`}
          style={{ background: `hsl(${teamHue} 45% 16%)`, ['--tw-ring-color' as string]: `hsl(${teamHue} 55% 30%)` } as React.CSSProperties}
        >
          {showImg ? (
            <img
              src={avatarUrl!}
              alt={name}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              onError={() => setImgErr(true)}
            />
          ) : (
            <span
              className={size === 'compact' ? 'text-xl font-black' : 'text-3xl font-black lg:text-4xl'}
              style={{ color: `hsl(${teamHue} 80% 75%)` }}
            >
              {initials(name)}
            </span>
          )}
        </div>
        {tierLabel && (
          <div
            className="absolute -bottom-2 -right-2 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
            style={{ background: `${tierColor}22`, border: `1px solid ${tierColor}66`, color: tierColor }}
          >
            {tierLabel}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className={size === 'compact' ? 'truncate text-lg font-black text-white' : 'truncate text-xl font-black leading-tight tracking-tight text-white lg:text-2xl'}>
          {name}
        </h2>

        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-white/70">
          {teamLogoUrl && <img src={teamLogoUrl} alt="" loading="lazy" decoding="async" className="h-4 w-4 shrink-0 object-contain" />}
          <span>{team}</span>
          <span className="text-white/30">vs</span>
          {opponentLogoUrl && <img src={opponentLogoUrl} alt="" loading="lazy" decoding="async" className="h-4 w-4 shrink-0 object-contain" />}
          <span>{opponent}</span>
        </div>

        {subtitle && <p className="mt-0.5 truncate text-xs text-white/40">{subtitle}</p>}
        {meta && size === 'full' && <p className="mt-0.5 hidden text-xs text-white/30 lg:block">{meta}</p>}

        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((chip, i) => (
              <span
                key={`${chip.label}-${i}`}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${CHIP_TONE[chip.tone ?? 'neutral']}`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
