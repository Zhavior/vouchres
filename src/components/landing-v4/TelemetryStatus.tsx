import React from 'react';
import type { LandingTelemetry, TelemetryMode } from '../../hooks/public/useLandingTelemetry';
import { MODE_COPY, slateLabel, utcClock } from './telemetryStatusCopy';

/**
 * Status badges for every landing panel that renders live model numbers.
 * The copy and formatters live in ./telemetryStatusCopy so this file exports
 * components only.
 */

export function TelemetryStatusBadge({
  telemetry,
  className = '',
}: {
  telemetry: Pick<LandingTelemetry, 'mode' | 'slateDate' | 'nextFirstPitch' | 'isLoading'>;
  className?: string;
}) {
  if (telemetry.isLoading) {
    return (
      <span
        className={`inline-flex items-center border border-white/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 ${className}`}
      >
        [ System status: syncing feeds ]
      </span>
    );
  }

  const copy = MODE_COPY[telemetry.mode];
  const opensAt = utcClock(telemetry.nextFirstPitch);
  const replayFrom = telemetry.mode === 'replay' ? slateLabel(telemetry.slateDate) : null;

  const trailer = replayFrom
    ? `SLATE OF ${replayFrom}`
    : opensAt
      ? `NEXT SLATE OPENS ${opensAt}`
      : null;

  return (
    <span
      className={`inline-flex items-center border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] ${copy.tone} ${className}`}
    >
      [ System status: {copy.status}
      {trailer ? ` / ${trailer}` : ''} ]
    </span>
  );
}

/**
 * Panel-corner variant. Same truth, less room.
 */
export function TelemetryModeChip({
  mode,
  className = '',
}: {
  mode: TelemetryMode;
  className?: string;
}) {
  const copy = MODE_COPY[mode];
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] ${copy.tone} ${className}`}
    >
      {copy.chip}
    </span>
  );
}
