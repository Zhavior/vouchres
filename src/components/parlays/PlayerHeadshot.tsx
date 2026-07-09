import React, { useState, useEffect } from 'react';
import { getMlbHeadshotUrl, getPlayerInitials, MLB_HEADSHOT_IMG_CLASS, normalizePlayerId } from '../../lib/mlbHeadshot';

interface Props {
  /** Player display name (used for initials fallback + alt text). */
  name?: string;
  /** MLB player id (number or id-ish string like "hr-665487"). */
  playerId?: number | string | null;
  /** Pre-resolved headshot URL (takes precedence over playerId). */
  headshotUrl?: string | null;
  /** Square size in px. Default 40. */
  size?: number;
  /** When true, loads image eagerly (hero/selected player). Default false for lists. */
  priority?: boolean;
}

/**
 * Circular MLB player headshot with a graceful initials fallback.
 * - Renders the official mlbstatic image when a real player id (or url) exists.
 * - Falls back to an initials avatar when there is no id OR the image fails to
 *   load — never a broken-image icon, and the layout size stays fixed.
 */
export default function PlayerHeadshot({ name, playerId, headshotUrl, size = 40, priority = false }: Props) {
  const resolvedUrl = headshotUrl || getMlbHeadshotUrl(playerId, size * 2);
  const [failed, setFailed] = useState(false);

  // Reset the error state if the target player changes.
  useEffect(() => {
    setFailed(false);
  }, [resolvedUrl]);

  const initials = getPlayerInitials(name);
  const dim = { width: size, height: size } as const;
  const showImage = !!resolvedUrl && !failed;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/40 shadow-[0_0_0_1px_rgba(0,240,255,0.12),0_2px_8px_rgba(0,0,0,0.45)]"
      style={dim}
      aria-label={name || 'Player'}
    >
      {/* Initials sit underneath so they show instantly and on image failure. */}
      <span
        className="select-none font-black uppercase tracking-tight text-white/70"
        style={{ fontSize: Math.max(10, Math.round(size * 0.34)) }}
      >
        {initials}
      </span>
      {showImage && (
        <img
          src={resolvedUrl!}
          alt={name || 'Player headshot'}
          width={size}
          height={size}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'low'}
          referrerPolicy="no-referrer"
          className={`absolute inset-0 ${MLB_HEADSHOT_IMG_CLASS}`}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

/** Convenience: does this leg have any usable id/url for a real headshot? */
export function hasRealHeadshot(playerId?: number | string | null, headshotUrl?: string | null): boolean {
  return !!headshotUrl || normalizePlayerId(playerId) !== null;
}
