import React from 'react';
import { Activity, ClipboardCheck, Wind, Crosshair } from 'lucide-react';
import type { SlateTelemetry } from '../utils/slateTelemetry';

/**
 * Top telemetry bar — four quick-scan slate metrics.
 * Solid fills only (no backdrop-blur) so the bar never re-composites the
 * scrolling board underneath it.
 */

interface TelemetryTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  accent: string;
}

function TelemetryTile({ icon, label, value, detail, accent }: TelemetryTileProps) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-white/[0.07] bg-[#0a1010] px-2.5 py-2.5 sm:gap-3 sm:px-3.5 sm:py-3">
      <span
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-[#060a0a] sm:h-8 sm:w-8"
        style={{ color: accent }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="block truncate font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-white/40 sm:text-[9px] sm:tracking-[0.16em]">
          {label}
        </span>
        <strong
          className="mt-1 block truncate font-mono text-base font-black leading-none tabular-nums sm:text-lg"
          style={{ color: accent }}
        >
          {value}
        </strong>
        <span className="mt-1 block truncate font-mono text-[9px] font-semibold text-white/45 sm:text-[10px]">
          {detail}
        </span>
      </div>
    </div>
  );
}

export const HrNextTelemetryBar = React.memo(function HrNextTelemetryBar({
  telemetry,
}: {
  telemetry: SlateTelemetry;
}) {
  const { volume, lineup, weather, topCollision } = telemetry;

  const lineupValue = lineup.total > 0 ? `${lineup.confirmed}/${lineup.total}` : '—';
  const lineupDetail = lineup.total === 0
    ? 'No pool on the slate'
    : `${lineup.projected} projected${lineup.unknown > 0 ? ` · ${lineup.unknown} unknown` : ''}`;

  const weatherValue = weather.hasFeed ? `${weather.boostedRows}` : 'N/A';
  const weatherDetail = !weather.hasFeed
    ? 'No weather or park feed'
    : weather.topParkIndex != null
      ? `Peak park ${Math.round(weather.topParkIndex)}${weather.topParkVenue ? ` · ${weather.topParkVenue}` : ''}`
      : `Mean weather index ${weather.averageWeatherIndex}`;

  return (
    // 2×2 on phones: four stacked full-width tiles pushed the board itself a
    // full screen down before a single player card was visible.
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 xl:grid-cols-4">
      <TelemetryTile
        icon={<Activity className="h-4 w-4" />}
        label="Slate Volume"
        value={volume.games > 0 ? `${volume.games}` : '—'}
        detail={volume.games > 0 ? `${volume.players} batters analyzed` : 'No active games'}
        accent="#10B981"
      />
      <TelemetryTile
        icon={<ClipboardCheck className="h-4 w-4" />}
        label="Lineup Status"
        value={lineupValue}
        detail={lineupDetail}
        accent="#10B981"
      />
      <TelemetryTile
        icon={<Wind className="h-4 w-4" />}
        label="Weather Edge"
        value={weatherValue}
        detail={weatherDetail}
        accent="#F59E0B"
      />
      <TelemetryTile
        icon={<Crosshair className="h-4 w-4" />}
        label="Top Collision Score"
        value={topCollision ? `${topCollision.hrpi}` : '—'}
        detail={topCollision ? `${topCollision.playerName} · ${topCollision.team}` : 'Awaiting board'}
        accent={topCollision ? topCollision.tier.accent : '#A855F7'}
      />
    </div>
  );
});
