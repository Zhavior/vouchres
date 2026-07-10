/**
 * HrStatsTab — Pro Stats Panel (drawer)
 *
 * Real MLB Stats API game logs for Recent Form + vs Team.
 * BvP stays simulated until a reliable pitcher MLB id is on HrWatchRow.
 * Charts: Recharts (already in project — best OSS fit for React + MLB box scores).
 */

import React, { useMemo } from 'react';
import { Lock, TrendingUp, TrendingDown, Minus, BarChart2, Target, Activity, Users } from 'lucide-react';
import { Z8_AMBER_HEX, Z8_CYAN_HEX, Z8_EMERALD_HEX } from '../../../../theme/z8Tokens';
import type { HrWatchRow } from '../../types/hrWatch';
import { useRealGameLog } from '../../hooks/useRealGameLog';
import { lastNGames, gamesAgainstOpponent } from '../../utils/realGameLogs';
import { generateBvPLogs, bvpCareerTotals } from '../../utils/bvpSimulated';
import {
  BvPSeasonChart,
  FormTrendChart,
  GameLogEmpty,
  GameLogLoading,
  HrActivityChart,
  LayerHorizontalChart,
  LayerRadarChart,
  ProductionBarChart,
  SimulatedBadge,
  type LayerChartRow,
} from '../Profile/HrProfileCharts';
import '../../../../styles/hr-profile.css';

interface HrStatsTabProps {
  player: HrWatchRow;
  isPro?: boolean;
}

interface LayerRankRow extends LayerChartRow {
  icon: string;
  leagueAvg: number;
  accentHex: string;
}

function getLayerRows(p: HrWatchRow): LayerRankRow[] {
  return [
    { id: 'power', label: 'Hitter Power', icon: '💪', weight: 25, value: p.hitterPower, leagueAvg: 52, accentHex: Z8_AMBER_HEX },
    { id: 'pitcher', label: 'Pitcher Vulnerability', icon: '⚾', weight: 20, value: p.pitcherVulnerability, leagueAvg: 48, accentHex: '#ef4444' },
    { id: 'pitch', label: 'Pitch Mix Advantage', icon: '🎯', weight: 15, value: p.pitchMix, leagueAvg: 50, accentHex: Z8_EMERALD_HEX },
    { id: 'park', label: 'Park Factor', icon: '🏟️', weight: 10, value: p.parkFactor, leagueAvg: 50, accentHex: Z8_CYAN_HEX },
    { id: 'form', label: 'Recent Form', icon: '🔥', weight: 10, value: p.recentForm, leagueAvg: 50, accentHex: '#10b981' },
    { id: 'weather', label: 'Weather', icon: '🌬️', weight: 5, value: p.weather, leagueAvg: 55, accentHex: Z8_CYAN_HEX },
    { id: 'platoon', label: 'Platoon Split', icon: '🤜', weight: 5, value: p.platoon, leagueAvg: 50, accentHex: Z8_AMBER_HEX },
    { id: 'bullpen', label: 'Bullpen Risk', icon: '🔄', weight: 3, value: p.bullpen, leagueAvg: 48, accentHex: '#f97316' },
    { id: 'lineup', label: 'Lineup Context', icon: '📋', weight: 3, value: p.lineupContext, leagueAvg: 52, accentHex: Z8_EMERALD_HEX },
    { id: 'swing', label: 'Swing Decisions', icon: '🎪', weight: 2, value: p.swingDecisions, leagueAvg: 50, accentHex: '#10b981' },
    { id: 'bvp', label: 'Batter vs Pitcher', icon: '📊', weight: 2, value: p.bvpScore, leagueAvg: 50, accentHex: Z8_CYAN_HEX },
    { id: 'vegas', label: 'Vegas Alignment', icon: '💰', weight: 0, value: p.vegasEdgeScore, leagueAvg: 50, accentHex: Z8_AMBER_HEX },
  ];
}

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  simulated?: boolean;
}> = ({ icon, title, subtitle, simulated }) => (
  <div className="mb-3 flex items-center gap-2">
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04]">{icon}</div>
    <div>
      <div className="flex items-center gap-2">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/90">{title}</p>
        {simulated && <SimulatedBadge />}
      </div>
      {subtitle && <p className="text-[10px] text-slate-400">{subtitle}</p>}
    </div>
  </div>
);

const ProLock: React.FC<{ label: string }> = ({ label }) => (
  <div className="relative overflow-hidden rounded-xl border border-white/10">
    <div className="pointer-events-none select-none p-4 opacity-40 blur-sm">
      <div className="h-28 rounded-lg bg-white/[0.04]" />
    </div>
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-[#02060e]/85 backdrop-blur-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-500/35">
        <Lock className="h-4 w-4 text-amber-400" />
      </div>
      <p className="text-xs font-bold text-amber-400">PRO</p>
      <p className="px-4 text-center text-[10px] text-slate-400">{label}</p>
    </div>
  </div>
);

const ResultDot: React.FC<{ hrs: number }> = ({ hrs }) => (
  <span
    className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ${
      hrs > 0 ? 'bg-amber-400 ring-amber-400/35' : 'bg-zinc-600 ring-zinc-600/30'
    }`}
  />
);

export const HrStatsTab: React.FC<HrStatsTabProps> = ({ player, isPro = true }) => {
  const { logs: realLog, state: logState } = useRealGameLog(player.playerId, true);
  const layers = useMemo(() => getLayerRows(player), [player]);
  const bvpLogs = useMemo(
    () => generateBvPLogs(player.playerName, player.pitcherName ?? ''),
    [player.playerName, player.pitcherName],
  );
  const formLogs = useMemo(() => lastNGames(realLog ?? [], 10), [realLog]);
  const teamLogs = useMemo(
    () => gamesAgainstOpponent(realLog ?? [], player.opponent, 5),
    [realLog, player.opponent],
  );
  const bvpCareer = useMemo(() => bvpCareerTotals(bvpLogs), [bvpLogs]);

  const formHRs = formLogs.filter((g) => g.hrs > 0).length;
  const formTB =
    formLogs.length > 0
      ? +(formLogs.reduce((s, g) => s + g.totalBases, 0) / formLogs.length).toFixed(1)
      : 0;

  return (
    <div className="ve-hr-drawer flex flex-col gap-6 pb-4">
      {/* Layer charts — deep dive lives here, not on Overview */}
      <div>
        <SectionHeader
          icon={<BarChart2 className="h-4 w-4 text-slate-400" />}
          title="Layer model"
          subtitle="Full 12-layer breakdown with charts"
        />
        <div className="ve-hr-chart-panel mb-3">
          <LayerRadarChart layers={layers} height={240} />
        </div>
        <div className="ve-hr-chart-panel">
          <LayerHorizontalChart layers={layers} height={300} />
        </div>
      </div>

      {/* Recent form — REAL */}
      <div>
        <SectionHeader
          icon={<Activity className="h-4 w-4 text-emerald-400" />}
          title="Recent Form"
          subtitle={
            logState === 'ready'
              ? `Last ${formLogs.length} games — MLB Stats API box scores`
              : 'Real box-score production (total bases per game)'
          }
        />
        {logState === 'loading' && <GameLogLoading />}
        {logState === 'unavailable' && (
          <GameLogEmpty message="No real game log available for this player right now." />
        )}
        {logState === 'ready' && formLogs.length === 0 && (
          <GameLogEmpty message="No games logged yet this season." />
        )}
        {logState === 'ready' && formLogs.length > 0 && (
          <>
            <div className="mb-3 grid grid-cols-4 gap-2">
              {[
                { label: 'HRs', value: formHRs, color: '#fbbf24' },
                { label: 'Hits', value: formLogs.reduce((s, g) => s + g.hits, 0), color: '#fff' },
                { label: 'Avg TB', value: formTB, color: '#22d3ee' },
                { label: 'HR Rate', value: `${((formHRs / formLogs.length) * 100).toFixed(0)}%`, color: '#34d399' },
              ].map((s) => (
                <div key={s.label} className="ve-hr-stat-chip">
                  <span className="ve-hr-stat-chip__value text-base" style={{ color: s.color }}>{s.value}</span>
                  <span className="ve-hr-stat-chip__label">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="ve-hr-chart-panel mb-3">
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Total bases per game</p>
              <ProductionBarChart logs={formLogs} height={130} />
            </div>
            <div className="ve-hr-chart-panel">
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">TB trend + HR activity</p>
              <FormTrendChart logs={formLogs} height={110} />
              <div className="mt-2">
                <HrActivityChart logs={formLogs} height={56} />
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {formLogs.map((g, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <ResultDot hrs={g.hrs} />
                    <span className="text-[8px] text-slate-500">{g.opponentAbbr}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* BvP — simulated */}
      <div>
        <SectionHeader
          icon={<Target className="h-4 w-4 text-emerald-400" />}
          title={`vs. ${player.pitcherName ?? 'Pitcher'}`}
          subtitle="No pitcher MLB id — illustrative matchup trend only"
          simulated
        />
        {isPro ? (
          <>
            <div className="ve-hr-chart-panel mb-3">
              <BvPSeasonChart logs={bvpLogs} height={160} />
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <div className="grid grid-cols-6 gap-0 bg-[#02060e] px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                <span>Season</span>
                <span className="text-right">PA</span>
                <span className="text-right">HR</span>
                <span className="text-right">AVG</span>
                <span className="text-right">SLG</span>
                <span className="text-right">OBP</span>
              </div>
              {bvpLogs.map((row, i) => (
                <div
                  key={row.season}
                  className="grid grid-cols-6 gap-0 px-3 py-2.5"
                  style={{
                    background: i % 2 === 0 ? '#0a0e14' : '#0d1219',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-xs font-bold text-white/90">{row.season}</span>
                  <span className="text-right text-xs tabular-nums text-slate-400">{row.pa}</span>
                  <span className={`text-right text-xs font-bold tabular-nums ${row.hrs > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{row.hrs}</span>
                  <span className="text-right text-xs tabular-nums text-white/85">{row.avg.toFixed(3)}</span>
                  <span className={`text-right text-xs tabular-nums ${row.slg > 0.45 ? 'text-emerald-400' : 'text-white/85'}`}>{row.slg.toFixed(3)}</span>
                  <span className="text-right text-xs tabular-nums text-white/85">{row.obp.toFixed(3)}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 border-t border-white/10 bg-[#02060e] px-3 py-2.5">
                {Number(bvpCareer.hrs) >= 2 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                ) : Number(bvpCareer.hrs) === 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-slate-500" />
                )}
                <span className="text-[10px] text-slate-400">{bvpCareer.hrPct}% HR/PA career (simulated)</span>
              </div>
            </div>
          </>
        ) : (
          <ProLock label="Unlock career head-to-head stats with Pro" />
        )}
      </div>

      {/* vs Team — REAL */}
      <div>
        <SectionHeader
          icon={<Users className="h-4 w-4 text-amber-400" />}
          title={`vs. ${player.opponent}`}
          subtitle="Real box-score games this season"
        />
        {logState === 'loading' && <GameLogLoading />}
        {logState === 'ready' && teamLogs.length === 0 && (
          <GameLogEmpty message={`No games logged against ${player.opponent} yet this season.`} />
        )}
        {logState === 'ready' && teamLogs.length > 0 && (
          isPro ? (
            <>
              <div className="mb-3 grid grid-cols-4 gap-2">
                {[
                  { label: 'HRs', value: teamLogs.reduce((s, g) => s + g.hrs, 0), color: '#fbbf24' },
                  { label: 'Hits', value: teamLogs.reduce((s, g) => s + g.hits, 0), color: '#fff' },
                  { label: 'AB', value: teamLogs.reduce((s, g) => s + g.ab, 0), color: '#94a3b8' },
                  {
                    label: 'Avg TB',
                    value: +(teamLogs.reduce((s, g) => s + g.totalBases, 0) / teamLogs.length).toFixed(1),
                    color: '#22d3ee',
                  },
                ].map((s) => (
                  <div key={s.label} className="ve-hr-stat-chip">
                    <span className="ve-hr-stat-chip__value text-base" style={{ color: s.color }}>{s.value}</span>
                    <span className="ve-hr-stat-chip__label">{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="ve-hr-chart-panel mb-3">
                <ProductionBarChart logs={teamLogs} height={120} />
              </div>
              <div className="overflow-hidden rounded-xl border border-white/10">
                <div className="grid grid-cols-6 gap-0 bg-[#02060e] px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                  <span>Date</span>
                  <span className="text-right">AB</span>
                  <span className="text-right">H</span>
                  <span className="text-right">HR</span>
                  <span className="text-right">RBI</span>
                  <span className="text-right">TB</span>
                </div>
                {teamLogs.map((g, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-6 items-center gap-0 px-3 py-2.5"
                    style={{
                      background: i % 2 === 0 ? '#0a0e14' : '#0d1219',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <ResultDot hrs={g.hrs} />
                      <span className="text-[10px] font-semibold text-slate-400">{g.date}</span>
                    </div>
                    <span className="text-right text-xs tabular-nums text-slate-400">{g.ab}</span>
                    <span className="text-right text-xs tabular-nums text-white/85">{g.hits}</span>
                    <span className={`text-right text-xs font-bold tabular-nums ${g.hrs > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {g.hrs > 0 ? g.hrs : '—'}
                    </span>
                    <span className="text-right text-xs tabular-nums text-white/85">{g.rbi}</span>
                    <span className={`text-right text-xs font-semibold tabular-nums ${g.totalBases >= 4 ? 'text-amber-400' : g.totalBases >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {g.totalBases}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <ProLock label="Unlock vs-team game logs with Pro" />
          )
        )}
      </div>
    </div>
  );
};
