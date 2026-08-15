import React, { useMemo } from 'react';
import type { HrWatchRow } from '../../hr/types/hrWatch';

export interface RadarDimension {
  key: string;
  label: string;
  shortLabel: string;
  value: number | null;
  weight: string;
}

export interface HrMaxRadarHUDProps {
  row: HrWatchRow;
  size?: number;
  className?: string;
  showLabels?: boolean;
}

const AXIS_COUNT = 5;
const RADIUS_PADDING = 38;

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

export const HrMaxRadarHUD = React.memo(function HrMaxRadarHUD({
  row,
  size = 260,
  className = '',
  showLabels = true,
}: HrMaxRadarHUDProps) {
  const center = size / 2;
  const maxRadius = center - RADIUS_PADDING;

  const dimensions: RadarDimension[] = useMemo(() => {
    return [
      {
        key: 'power',
        label: 'Statcast Power',
        shortLabel: 'Power',
        value: typeof row.hitterPower === 'number' && Number.isFinite(row.hitterPower) ? Math.round(row.hitterPower) : null,
        weight: '35%',
      },
      {
        key: 'pitcher',
        label: 'Pitcher Matchup',
        shortLabel: 'Pitcher',
        value: typeof row.pitcherVulnerability === 'number' && Number.isFinite(row.pitcherVulnerability) ? Math.round(row.pitcherVulnerability) : null,
        weight: '35%',
      },
      {
        key: 'park',
        label: 'Park / Weather',
        shortLabel: 'Park',
        value: typeof (row.parkContext ?? row.parkFactor) === 'number' && Number.isFinite(row.parkContext ?? row.parkFactor) ? Math.round(row.parkContext ?? row.parkFactor!) : null,
        weight: '15%',
      },
      {
        key: 'arsenal',
        label: 'Arsenal / BvP',
        shortLabel: 'Arsenal',
        value: typeof (row.pitchMix ?? row.bvpScore ?? row.platoon) === 'number' && Number.isFinite(row.pitchMix ?? row.bvpScore ?? row.platoon) ? Math.round((row.pitchMix ?? row.bvpScore ?? row.platoon)!) : null,
        weight: '10%',
      },
      {
        key: 'form',
        label: 'Recent Contact',
        shortLabel: 'Form',
        value: typeof row.recentForm === 'number' && Number.isFinite(row.recentForm) ? Math.round(row.recentForm) : null,
        weight: '5%',
      },
    ];
  }, [row]);

  // Generate concentric polygon grid levels (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const stepAngle = 360 / AXIS_COUNT;

  // Data polygon points
  const dataPoints = useMemo(() => {
    return dimensions.map((dim, i) => {
      const angle = i * stepAngle;
      // Default to neutral 50 if missing for visualization, but render as pending
      const normalizedScore = dim.value != null ? Math.max(10, Math.min(100, dim.value)) : 50;
      const radius = (normalizedScore / 100) * maxRadius;
      return {
        ...polarToCartesian(center, center, radius, angle),
        angle,
        dim,
      };
    });
  }, [center, dimensions, maxRadius, stepAngle]);

  const polygonPath = useMemo(() => {
    if (dataPoints.length === 0) return '';
    return dataPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ') + ' Z';
  }, [dataPoints]);

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-auto max-w-[280px] overflow-visible drop-shadow-[0_0_15px_rgba(0,217,160,0.15)]"
        aria-label="5-factor tactical radar matrix"
      >
        <defs>
          {/* Radial radar gradient */}
          <radialGradient id="radarRadialGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--aurora-max-emerald, #00d9a0)" stopOpacity="0.3" />
            <stop offset="70%" stopColor="var(--aurora-max-emerald, #00d9a0)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--aurora-max-emerald, #00d9a0)" stopOpacity="0" />
          </radialGradient>

          {/* Polygon fill gradient */}
          <linearGradient id="radarPolyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--aurora-max-emerald, #00d9a0)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* Concentric Polygons */}
        {gridLevels.map((lvl, idx) => {
          const pts = Array.from({ length: AXIS_COUNT }).map((_, i) => {
            const p = polarToCartesian(center, center, maxRadius * lvl, i * stepAngle);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(' ');

          const isOuter = idx === gridLevels.length - 1;

          return (
            <polygon
              key={`grid-${lvl}`}
              points={pts}
              fill={isOuter ? 'rgba(0, 217, 160, 0.02)' : 'none'}
              stroke={isOuter ? 'rgba(0, 217, 160, 0.3)' : 'rgba(255, 255, 255, 0.08)'}
              strokeWidth={isOuter ? 1.5 : 1}
              strokeDasharray={isOuter ? undefined : '2 3'}
            />
          );
        })}

        {/* Axis Spokes */}
        {Array.from({ length: AXIS_COUNT }).map((_, i) => {
          const p = polarToCartesian(center, center, maxRadius, i * stepAngle);
          return (
            <line
              key={`spoke-${i}`}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth={1}
            />
          );
        })}

        {/* Outer Circular Reference Sweep */}
        <circle
          cx={center}
          cy={center}
          r={maxRadius}
          fill="none"
          stroke="rgba(0, 217, 160, 0.1)"
          strokeWidth={1}
        />

        {/* Data Polygon Fill */}
        <path
          d={polygonPath}
          fill="url(#radarPolyGrad)"
          stroke="var(--aurora-max-emerald, #00d9a0)"
          strokeWidth={2}
          className="transition-all duration-500 ease-out"
        />

        {/* Data Vertices */}
        {dataPoints.map((pt, i) => {
          const isMissing = pt.dim.value == null;
          return (
            <g key={`vertex-${i}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isMissing ? 2.5 : 4}
                fill={isMissing ? 'rgba(255, 255, 255, 0.3)' : 'var(--aurora-max-emerald, #00d9a0)'}
                stroke="#080d0a"
                strokeWidth={2}
                className="transition-all duration-500 ease-out"
              />
              {!isMissing && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={6}
                  fill="none"
                  stroke="var(--aurora-max-emerald, #00d9a0)"
                  strokeWidth={1}
                  opacity={0.6}
                  className="animate-ping motion-reduce:animate-none"
                  style={{ animationDuration: '3s', animationDelay: `${i * 0.4}s` }}
                />
              )}
            </g>
          );
        })}

        {/* Axis Labels & Values */}
        {showLabels &&
          dimensions.map((dim, i) => {
            const angle = i * stepAngle;
            const labelPos = polarToCartesian(center, center, maxRadius + 22, angle);
            const isMissing = dim.value == null;

            // Anchor text according to horizontal quadrant
            let textAnchor: 'start' | 'middle' | 'end' = 'middle';
            if (angle > 15 && angle < 165) textAnchor = 'start';
            else if (angle > 195 && angle < 345) textAnchor = 'end';

            return (
              <g key={`label-${dim.key}`} className="font-mono text-[10px]">
                <text
                  x={labelPos.x}
                  y={labelPos.y - 2}
                  textAnchor={textAnchor}
                  fill={isMissing ? 'rgba(255,255,255,0.4)' : '#e0e5dd'}
                  className="font-bold text-[9px] uppercase tracking-wider"
                >
                  {dim.shortLabel}
                </text>
                <text
                  x={labelPos.x}
                  y={labelPos.y + 9}
                  textAnchor={textAnchor}
                  fill={isMissing ? 'rgba(255,255,255,0.25)' : 'var(--aurora-max-emerald, #00d9a0)'}
                  className="font-black text-[10px] tabular-nums"
                >
                  {dim.value != null ? `${dim.value}` : '—'}
                </text>
              </g>
            );
          })}
      </svg>

      {/* Subtitle breakdown chip strip */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 font-mono text-[9px]">
        {dimensions.map((dim) => (
          <span
            key={dim.key}
            className={`px-1.5 py-0.5 rounded border ${
              dim.value != null && dim.value >= 70
                ? 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-[var(--aurora-max-emerald)] font-bold'
                : dim.value != null
                ? 'border-white/10 bg-white/[0.03] text-white/70'
                : 'border-white/5 bg-transparent text-white/30'
            }`}
          >
            {dim.shortLabel}: <span className="tabular-nums font-bold">{dim.value != null ? dim.value : '—'}</span>
          </span>
        ))}
      </div>
    </div>
  );
});
