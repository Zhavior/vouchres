/**
 * Shared Recharts visualizations for HR Intelligence profiles.
 * Fed by real MLB Stats API game logs where available; BvP stays simulated.
 */

import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
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

export const FormTrendChart: React.FC<{ logs: RealGameLog[]; height?: number }> = ({
  logs,
  height = 120,
}) => {
  if (logs.length < 2) return null;

  const chronological = [...logs].reverse();
  const data = chronological.map((g, i) => ({
    label: g.opponentAbbr,
    totalBases: g.totalBases,
    hrs: g.hrs,
    idx: i + 1,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="hrTbGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.cyan} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART.cyan} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: CHART.label, fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="tb" tick={{ fill: CHART.axis, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis yAxisId="hr" orientation="right" hide domain={[0, 2]} />
        <Tooltip content={<ChartTooltip />} />
        <Area yAxisId="tb" type="monotone" dataKey="totalBases" stroke={CHART.cyan} fill="url(#hrTbGradient)" strokeWidth={2} name="Total Bases" />
        <Line yAxisId="hr" type="stepAfter" dataKey="hrs" stroke={CHART.amber} strokeWidth={2} dot={{ r: 3, fill: CHART.amber }} name="HR" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export const HrActivityChart: React.FC<{ logs: RealGameLog[]; height?: number }> = ({
  logs,
  height = 72,
}) => {
  if (logs.length < 2) return null;

  const data = [...logs].reverse().map((g) => ({
    label: g.opponentAbbr,
    hrs: g.hrs,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="hrActGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.amber} stopOpacity={0.4} />
            <stop offset="100%" stopColor={CHART.amber} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" hide />
        <YAxis hide domain={[0, 'dataMax + 0.5']} />
        <Area type="stepAfter" dataKey="hrs" stroke={CHART.amber} fill="url(#hrActGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
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
