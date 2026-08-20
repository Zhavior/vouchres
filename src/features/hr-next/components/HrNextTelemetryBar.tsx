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
    <div className="flex items-start gap-2.5 border-2 border-white/15 bg-black p-3 font-mono shadow-md">
      <span
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center border border-white/15 bg-zinc-950"
        style={{ color: accent }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-[9px] font-black uppercase tracking-widest text-zinc-500">
          {label}
        </span>
        <strong
          className="mt-1 block truncate text-lg sm:text-xl font-black leading-none tabular-nums font-sans"
          style={{ color: accent }}
        >
          {value}
        </strong>
        <span className="mt-1 block truncate text-[10px] text-zinc-400 font-mono font-medium">
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
    ? 'NO WEATHER FEED'
    : weather.topParkIndex != null
      ? `PEAK PARK ${Math.round(weather.topParkIndex)}${weather.topParkVenue ? ` · ${weather.topParkVenue}` : ''}`
      : `MEAN INDEX ${weather.averageWeatherIndex}`;

  return (
    <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
      <TelemetryTile
        icon={<Activity className="h-4 w-4" />}
        label="SLATE VOLUME"
        value={volume.games > 0 ? `${volume.games}` : '—'}
        detail={volume.games > 0 ? `${volume.players} BATTERS ANALYZED` : 'NO ACTIVE GAMES'}
        accent="#00F0FF"
      />
      <TelemetryTile
        icon={<ClipboardCheck className="h-4 w-4" />}
        label="LINEUP STATUS"
        value={lineupValue}
        detail={lineupDetail}
        accent="#34D399"
      />
      <TelemetryTile
        icon={<Wind className="h-4 w-4" />}
        label="WEATHER EDGE"
        value={weatherValue}
        detail={weatherDetail}
        accent="#FBBF24"
      />
      <TelemetryTile
        icon={<Crosshair className="h-4 w-4" />}
        label="TOP COLLISION"
        value={topCollision ? `${topCollision.hrpi}` : '—'}
        detail={topCollision ? `${topCollision.playerName} · ${topCollision.team}` : 'AWAITING BOARD'}
        accent={topCollision ? topCollision.tier.accent : '#C084FC'}
      />
    </div>
  );
});

