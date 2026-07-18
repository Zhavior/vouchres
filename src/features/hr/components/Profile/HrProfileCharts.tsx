/**
 * Shared Recharts visualizations for HR Intelligence profiles.
 * Fed by real MLB Stats API game logs where available; BvP stays simulated.
 */

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RealGameLog } from '../../utils/realGameLogs';
import type { BvPLog } from '../../utils/bvpSimulated';

const CHART = {
  grid: 'rgba(148, 163, 184, 0.12)',
  axis: 'rgba(148, 163, 184, 0.45)',
  label: 'rgba(148, 163, 184, 0.55)',
  panel: '#0a0e14',
  cyan: '#22d3ee',
  emerald: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  muted: 'rgba(255, 255, 255, 0.15)',
};

function barColor(g: RealGameLog): string {
  if (g.hrs > 0) return CHART.amber;
  if (g.totalBases >= 2) return CHART.emerald;
  if (g.hits > 0) return CHART.cyan;
  return CHART.muted;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: Record<string, unknown> }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{ background: '#0d1219', borderColor: 'rgba(255,255,255,0.12)' }}
    >
      {label && <p className="mb-1 font-semibold text-white/70">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="tabular-nums text-white/90" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export interface LayerChartRow {
  id: string;
  label: string;
  value: number | null | undefined;
  weight: number;
}

export const ProductionBarChart: React.FC<{ logs: RealGameLog[]; height?: number }> = ({
  logs,
  height = 140,
}) => {
  if (!logs.length) return null;

  const data = [...logs].reverse().map((g) => ({
    label: g.opponentAbbr,
    totalBases: g.totalBases,
    hrs: g.hrs,
    hits: g.hits,
    ab: g.ab,
    date: g.date,
    fill: barColor(g),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: CHART.label, fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: CHART.axis, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0]?.payload as (typeof data)[number];
            return (
              <div
                className="rounded-lg border px-3 py-2 text-xs"
                style={{ background: '#0d1219', borderColor: 'rgba(255,255,255,0.12)' }}
              >
                <p className="font-semibold text-white/80">{label} · {row.date}</p>
                <p className="text-white/70">{row.hits}-{row.ab}, {row.totalBases} TB{row.hrs > 0 ? `, ${row.hrs} HR` : ''}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="totalBases" radius={[4, 4, 0, 0]} maxBarSize={28}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

/** Smooth monotone path through points (Catmull-Rom → cubic Bezier). */
function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * HD production trend — custom SVG (not a thin Recharts sparkline).
 * Total-bases curve + amber HR event markers with opponent labels.
 */
export const FormTrendChart: React.FC<{ logs: RealGameLog[]; height?: number }> = ({
  logs,
  height = 168,
}) => {
  const [hover, setHover] = React.useState<number | null>(null);
  if (logs.length < 2) return null;

  const chronological = [...logs].reverse();
  const width = 640;
  const pad = { top: 18, right: 16, bottom: 28, left: 28 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const maxTb = Math.max(4, ...chronological.map((g) => g.totalBases));
  const points = chronological.map((g, i) => {
    const x = pad.left + (chronological.length === 1 ? plotW / 2 : (i / (chronological.length - 1)) * plotW);
    const y = pad.top + plotH - (g.totalBases / maxTb) * plotH;
    return { x, y, g, i };
  });
  const line = smoothPath(points.map(({ x, y }) => ({ x, y })));
  const area = `${line} L ${points[points.length - 1].x} ${pad.top + plotH} L ${points[0].x} ${pad.top + plotH} Z`;
  const gridYs = [0, 0.5, 1].map((t) => pad.top + plotH * (1 - t));
  const hovered = hover != null ? points[hover] : null;

  return (
    <div className="ve-hr-hd-chart" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Recent form total bases trend">
        <defs>
          <linearGradient id="veHrTbFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.cyan} stopOpacity={0.38} />
            <stop offset="55%" stopColor={CHART.cyan} stopOpacity={0.08} />
            <stop offset="100%" stopColor={CHART.cyan} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="veHrTbStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="55%" stopColor={CHART.cyan} />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <filter id="veHrNodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {gridYs.map((y, i) => (
          <g key={i}>
            <line x1={pad.left} x2={pad.left + plotW} y1={y} y2={y} stroke={CHART.grid} strokeWidth={1} />
            <text x={pad.left - 6} y={y + 3} textAnchor="end" fill={CHART.axis} fontSize={9} fontFamily="ui-monospace, monospace">
              {Math.round((1 - (y - pad.top) / plotH) * maxTb)}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#veHrTbFill)" className="ve-hr-hd-chart__area" />
        <path
          d={line}
          fill="none"
          stroke="url(#veHrTbStroke)"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ve-hr-hd-chart__line"
        />

        {points.map(({ x, y, g, i }) => {
          const isHr = g.hrs > 0;
          const active = hover === i;
          return (
            <g
              key={`${g.date}-${i}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'default' }}
            >
              <circle cx={x} cy={y} r={14} fill="transparent" />
              {isHr ? (
                <g filter="url(#veHrNodeGlow)">
                  <circle cx={x} cy={y} r={active ? 6.5 : 5.5} fill={CHART.amber} />
                  <circle cx={x} cy={y} r={active ? 10 : 9} fill="none" stroke={CHART.amber} strokeOpacity={0.35} strokeWidth={1.25} />
                </g>
              ) : (
                <circle
                  cx={x}
                  cy={y}
                  r={active ? 4.5 : 3.5}
                  fill={CHART.panel}
                  stroke={active ? CHART.cyan : 'rgba(103,232,249,0.75)'}
                  strokeWidth={1.6}
                />
              )}
              <text
                x={x}
                y={height - 8}
                textAnchor="middle"
                fill={isHr ? CHART.amber : CHART.label}
                fontSize={9}
                fontFamily="ui-monospace, monospace"
                fontWeight={isHr ? 700 : 500}
              >
                {g.opponentAbbr}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div className="ve-hr-hd-chart__tooltip" role="status">
          <span className="ve-hr-hd-chart__tooltip-date">{hovered.g.date}</span>
          <span>
            vs {hovered.g.opponentAbbr} · {hovered.g.hits}-{hovered.g.ab}
            {hovered.g.hrs > 0 ? ` · ${hovered.g.hrs} HR` : ''} · {hovered.g.totalBases} TB
          </span>
        </div>
      )}
    </div>
  );
};

export const HrActivityChart: React.FC<{ logs: RealGameLog[]; height?: number }> = ({
  logs,
  height = 88,
}) => {
  if (logs.length < 2) return null;

  const chronological = [...logs].reverse();
  const width = 480;
  const pad = { top: 10, right: 8, bottom: 6, left: 8 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const maxHr = Math.max(1, ...chronological.map((g) => g.hrs));
  const step = chronological.length > 1 ? plotW / (chronological.length - 1) : plotW;

  let d = '';
  chronological.forEach((g, i) => {
    const x = pad.left + i * step;
    const y = pad.top + plotH - (g.hrs / maxHr) * plotH * 0.85;
    d += i === 0 ? `M ${x} ${pad.top + plotH} L ${x} ${y}` : ` H ${x} V ${y}`;
  });
  d += ` H ${pad.left + (chronological.length - 1) * step} V ${pad.top + plotH} Z`;

  return (
    <div className="ve-hr-hd-chart ve-hr-hd-chart--activity" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="HR activity">
        <defs>
          <linearGradient id="veHrActFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.amber} stopOpacity={0.45} />
            <stop offset="100%" stopColor={CHART.amber} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path d={d} fill="url(#veHrActFill)" stroke={CHART.amber} strokeWidth={1.75} className="ve-hr-hd-chart__line" />
        {chronological.map((g, i) => {
          if (g.hrs <= 0) return null;
          const x = pad.left + i * step;
          const y = pad.top + plotH - (g.hrs / maxHr) * plotH * 0.85;
          return <circle key={`${g.date}-${i}`} cx={x} cy={y} r={3.5} fill={CHART.amber} />;
        })}
      </svg>
    </div>
  );
};

export const LayerRadarChart: React.FC<{ layers: LayerChartRow[]; height?: number }> = ({
  layers,
  height = 260,
}) => {
  const weighted = layers.filter((l) => l.weight > 0 && l.value != null);
  if (weighted.length < 3) return null;

  const data = weighted.map((l) => ({
    layer: l.label.split(' ').slice(0, 2).join(' '),
    score: Math.round(l.value ?? 0),
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
        <PolarGrid stroke={CHART.grid} />
        <PolarAngleAxis dataKey="layer" tick={{ fill: CHART.label, fontSize: 9 }} />
        <Radar name="Layer score" dataKey="score" stroke={CHART.cyan} fill={CHART.cyan} fillOpacity={0.22} strokeWidth={2} />
        <Tooltip content={<ChartTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export const LayerHorizontalChart: React.FC<{ layers: LayerChartRow[]; height?: number }> = ({
  layers,
  height = 320,
}) => {
  const rows = layers
    .filter((l) => l.weight > 0)
    .map((l) => ({
      name: l.label.length > 16 ? `${l.label.slice(0, 14)}…` : l.label,
      score: l.value ?? 0,
      weight: l.weight,
      isNull: l.value == null,
    }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: CHART.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={92} tick={{ fill: CHART.label, fontSize: 9 }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={14}>
          {rows.map((row, i) => (
            <Cell key={i} fill={row.isNull ? CHART.muted : CHART.cyan} fillOpacity={row.isNull ? 0.35 : 0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export const BvPSeasonChart: React.FC<{ logs: BvPLog[]; height?: number }> = ({ logs, height = 180 }) => {
  if (!logs.length) return null;

  const data = logs.map((row) => ({
    season: row.season,
    avg: +row.avg.toFixed(3),
    obp: +row.obp.toFixed(3),
    slg: +row.slg.toFixed(3),
    hrs: row.hrs,
    pa: row.pa,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="season" tick={{ fill: CHART.label, fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: CHART.axis, fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 0.9]} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0]?.payload as (typeof data)[number];
            return (
              <div className="rounded-lg border px-3 py-2 text-xs" style={{ background: '#0d1219', borderColor: 'rgba(255,255,255,0.12)' }}>
                <p className="font-semibold text-white/80">{label} · {row.pa} PA</p>
                <p className="text-cyan-300">AVG {row.avg}</p>
                <p className="text-emerald-300">OBP {row.obp}</p>
                <p className="text-amber-300">SLG {row.slg}{row.hrs > 0 ? ` · ${row.hrs} HR` : ''}</p>
              </div>
            );
          }}
        />
        <Legend wrapperStyle={{ fontSize: 10, color: CHART.label }} />
        <Bar dataKey="avg" fill={CHART.cyan} radius={[3, 3, 0, 0]} maxBarSize={16} name="AVG" />
        <Bar dataKey="obp" fill={CHART.emerald} radius={[3, 3, 0, 0]} maxBarSize={16} name="OBP" />
        <Bar dataKey="slg" fill={CHART.amber} radius={[3, 3, 0, 0]} maxBarSize={16} name="SLG" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const GameLogLoading: React.FC = () => (
  <div className="ve-hr-chart-panel py-8 text-center text-xs font-medium text-white/45">
    Loading real game log from MLB Stats API…
  </div>
);

export const GameLogEmpty: React.FC<{ message: string }> = ({ message }) => (
  <div className="ve-hr-chart-panel py-8 text-center text-xs font-medium text-white/45">{message}</div>
);

export const SimulatedBadge: React.FC = () => (
  <span
    className="rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.1em]"
    style={{ background: 'rgba(251, 191, 36, 0.14)', color: '#fbbf24' }}
    title="Illustrative — real head-to-head history isn't available without a pitcher MLB id"
  >
    Simulated
  </span>
);
