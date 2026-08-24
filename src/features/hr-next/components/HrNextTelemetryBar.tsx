import React from 'react';
import { Activity, ClipboardCheck, Wind, Crosshair } from 'lucide-react';
import type { SlateTelemetry } from '../utils/slateTelemetry';

interface TelemetryTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  accent: string;
}

function TelemetryTile({ icon, label, value, detail, accent }: TelemetryTileProps) {
  return (
    <div className="flex min-w-0 items-baseline gap-3 border-l border-white/[0.08] px-4 py-3 first:border-l-0 first:pl-0">
      <span className="mt-0.5 shrink-0" style={{ color: accent }} aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="block truncate font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-white/40">
          {label}
        </span>
        <strong
          className="mt-1 block truncate font-mono text-xl font-bold leading-none tabular-nums"
          style={{ color: accent }}
        >
          {value}
        </strong>
        <span className="mt-1 block truncate font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
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
    ? 'NO ACTIVE POOL'
    : `${lineup.projected} PROJECTED${lineup.unknown > 0 ? ` · ${lineup.unknown} UNKNOWN` : ''}`;

  const weatherValue = weather.hasFeed ? `${weather.boostedRows}` : 'N/A';
  const weatherDetail = !weather.hasFeed
    ? weather.topParkIndex != null
      ? `NO WEATHER · PARK ${Math.round(weather.topParkIndex)} AVAILABLE`
      : 'NO WEATHER FEED'
    : weather.topParkIndex != null
      ? `PEAK PARK ${Math.round(weather.topParkIndex)}${weather.topParkVenue ? ` · ${weather.topParkVenue}` : ''}`
      : `MEAN INDEX ${weather.averageWeatherIndex}`;

  return (
    <div className="grid grid-cols-2 border-y border-white/[0.08] xl:grid-cols-4">
      <TelemetryTile
        icon={<Activity className="h-3.5 w-3.5" />}
        label="SLATE VOLUME"
        value={volume.games > 0 ? `${volume.games}` : '—'}
        detail={volume.games > 0 ? `${volume.players} BATTERS ANALYZED` : 'NO ACTIVE GAMES'}
        accent="#4FB8DC"
      />
      <TelemetryTile
        icon={<ClipboardCheck className="h-3.5 w-3.5" />}
        label="LINEUP STATUS"
        value={lineupValue}
        detail={lineupDetail}
        accent="#31B583"
      />
      <TelemetryTile
        icon={<Wind className="h-3.5 w-3.5" />}
        label="WEATHER EDGE"
        value={weatherValue}
        detail={weatherDetail}
        accent="#D99C4A"
      />
      <TelemetryTile
        icon={<Crosshair className="h-3.5 w-3.5" />}
        label="TOP COLLISION"
        value={topCollision ? `${topCollision.hrpi}` : '—'}
        detail={topCollision ? `${topCollision.playerName} · ${topCollision.team}` : 'AWAITING BOARD'}
        accent={topCollision ? topCollision.tier.accent : '#C084FC'}
      />
    </div>
  );
});
