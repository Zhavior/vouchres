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
  /**
   * `circle` is the avatar used in dense rows. `portrait` frames the source at
   * its real 2:3 ratio so the whole headshot is visible — MLB serves 112x168,
   * so a square circular frame contains it to ~2/3 width and then masks the
   * shoulders off. Use `portrait` anywhere the player is the subject rather
   * than a row marker.
   */
  shape?: 'circle' | 'portrait';
  /** When true, loads image eagerly (hero/selected player). Default false for lists. */
  priority?: boolean;
}

/**
 * Circular MLB player headshot with a graceful initials fallback.
 * - Renders the official mlbstatic image when a real player id (or url) exists.
 * - Falls back to an initials avatar when there is no id OR the image fails to
 *   load — never a broken-image icon, and the layout size stays fixed.
 */
export default function PlayerHeadshot({
  name,
  playerId,
  headshotUrl,
  size = 40,
  priority = false,
  shape = 'circle',
}: Props) {
  const portrait = shape === 'portrait';
  const resolvedUrl = headshotUrl || getMlbHeadshotUrl(playerId, size * 2);
  const [failed, setFailed] = useState(false);

  // Reset the error state if the target player changes.
  useEffect(() => {
    setFailed(false);
  }, [resolvedUrl]);

  const initials = getPlayerInitials(name);
  // 2:3 matches what MLB actually serves, so nothing is letterboxed or cropped.
  const dim = { width: size, height: portrait ? Math.round(size * 1.5) : size } as const;
  const showImage = !!resolvedUrl && !failed;

  return (
    <div
      /*
       * The ring was rgba(0,240,255) — the legacy #00F0FF neon that index.css
       * removed for hue drift. This component is imported by 55 files, so that
       * one literal was tinting every headshot in the product. Now a plain
       * hairline, matching the desk surfaces it sits on.
       */
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-white/[0.12] bg-white/[0.04] ${
        portrait ? '' : 'rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.45)]'
      }`}
      style={dim}
      aria-label={name || 'Player'}
    >
      {/* Initials sit underneath so they show instantly and on image failure. */}
      <span
        className="select-none font-bold uppercase tracking-tight text-white/70"
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
          className={`absolute inset-0 h-full w-full object-contain ${
            portrait ? 'object-center' : 'object-[center_18%]'
          }`}
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
