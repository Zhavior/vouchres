/**
 * PlayerEdgeGraphs — MLB API-backed research graphs for Player Edge Lab.
 * Replaces placeholder ProLockedCards with honest real/empty states.
 */
import React, { useMemo } from 'react';
import { Activity, Target, Users, Zap } from 'lucide-react';
import { ACCENT } from '../../theme/colors';
import { ProGraphShell } from './ProGraphShell';
import { ProSignalBar } from './ProSignalBar';
import { SignalGraph } from './SignalGraph';
import { VerifiedGraphEmptyState } from './VerifiedGraphEmptyState';
import { StatChip, fmtDecimal, fmtInt } from '../ui/primitives';
import type { PlayerEdgeResearchPayload } from '../../pages/pro/usePlayerEdgeResearch';

export interface PlayerEdgeGraphsProps {
  research: PlayerEdgeResearchPayload | null;
  loading?: boolean;
  error?: string | null;
  pitcherName?: string | null;
  opponent?: string | null;
  className?: string;
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 32;
  const pad = 3;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  const max = Math.max(...values, 0.01);
  const pts = values
    .map((v, i) => `${pad + (i / (values.length - 1)) * iw},${pad + ih - (v / max) * ih}`)
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-90">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const BatterVsPitcherGraph: React.FC<{
  research: PlayerEdgeResearchPayload;
  pitcherName?: string | null;
}> = React.memo(function BatterVsPitcherGraph({ research, pitcherName }) {
  const bvp = research.batterVsPitcher;

  if (!bvp?.ab) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        sectionTitle="Batter vs Pitcher"
        title="No verified BvP history"
        detail={
          pitcherName
            ? `MLB Stats API returned no career plate appearances vs ${pitcherName}.`
            : 'Opposing pitcher ID is required for verified batter-vs-pitcher history.'
        }
      />
    );
  }

  const avgPct = bvp.avg != null ? bvp.avg * 100 : null;
  const slgPct = bvp.slg != null ? bvp.slg * 100 : null;
  const opsPct = bvp.ops != null ? bvp.ops * 100 : null;

  return (
    <ProGraphShell
      icon={Target}
      title="Batter vs Pitcher"
      subtitle={pitcherName ? `Career vs ${pitcherName}` : 'Career head-to-head'}
      accent={ACCENT.matchup}
      right={
        <span className="rounded-full border border-[hsl(var(--ve-accent-pink)/0.28)] bg-[hsl(var(--ve-accent-pink)/0.08)] px-2 py-0.5 font-mono text-[10px] font-black text-[hsl(var(--ve-accent-pink))]">
          {bvp.ab} AB
        </span>
      }
      footer="Career totals from MLB Stats API vsPlayerTotal. No simulated matchup history."
    >
      <div className="mb-3 grid grid-cols-4 gap-2">
        <StatChip label="PA" value={fmtInt(bvp.ab + bvp.bb)} color={ACCENT.matchup} />
        <StatChip label="HR" value={fmtInt(bvp.hr)} color={ACCENT.power} />
        <StatChip label="H" value={fmtInt(bvp.h)} color={ACCENT.emerald} />
        <StatChip label="K" value={fmtInt(bvp.k)} color={ACCENT.risk} />
      </div>
      <div className="space-y-2.5">
        <ProSignalBar label="AVG" value={avgPct} max={40} color={ACCENT.matchup} hint={bvp.avg != null ? bvp.avg.toFixed(3) : undefined} />
        <ProSignalBar label="SLG" value={slgPct} max={70} color={ACCENT.power} hint={bvp.slg != null ? bvp.slg.toFixed(3) : undefined} />
        <ProSignalBar label="OPS" value={opsPct} max={110} color={ACCENT.final} hint={bvp.ops != null ? bvp.ops.toFixed(3) : undefined} />
      </div>
    </ProGraphShell>
  );
});

const VsTeamTrendsGraph: React.FC<{
  research: PlayerEdgeResearchPayload;
  opponent?: string | null;
}> = React.memo(function VsTeamTrendsGraph({ research, opponent }) {
  const games = research.vsOpponent.length ? research.vsOpponent : research.gameLog.slice(0, 7);
  const usingSeasonLog = !research.vsOpponent.length;

  if (!games.length) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        sectionTitle="Vs Team Trends"
        title="No verified game log"
        detail="MLB Stats API did not return hitting game logs for this player."
      />
    );
  }

  const hrSeries = [...games].reverse().map((g) => g.homeRuns);
  const tbSeries = [...games].reverse().map((g) => g.totalBases);

  return (
    <ProGraphShell
      icon={Users}
      title={opponent && research.vsOpponent.length ? `vs ${opponent}` : 'Recent Game Log'}
      subtitle={
        usingSeasonLog
          ? 'Last 7 games · season log (no opponent filter matched)'
          : `${games.length} games vs ${opponent} this season`
      }
      accent={ACCENT.form}
      right={
        <span className="rounded-full border border-[hsl(var(--ve-accent-cyan)/0.28)] bg-[hsl(var(--ve-accent-cyan)/0.08)] px-2 py-0.5 font-mono text-[10px] font-black text-[hsl(var(--ve-accent-cyan))]">
          {games.reduce((s, g) => s + g.homeRuns, 0)} HR
        </span>
      }
      footer="Per-game hits, HRs, RBIs, and total bases from MLB Stats API gameLog. Exit velocity is not in this feed."
    >
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--ve-text-muted))]">HR trend</div>
          <MiniSparkline values={hrSeries} color="#f59e0b" />
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--ve-text-muted))]">TB trend</div>
          <MiniSparkline values={tbSeries} color="#22d3ee" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[hsl(var(--ve-border)/0.34)]">
        <div className="grid grid-cols-6 gap-0 bg-[hsl(var(--ve-bg-deep))] px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-[hsl(var(--ve-text-muted))]">
          <span>Date</span>
          <span className="text-right">AB</span>
          <span className="text-right">H</span>
          <span className="text-right">HR</span>
          <span className="text-right">RBI</span>
          <span className="text-right">TB</span>
        </div>
        {games.map((game, index) => (
          <div
            key={`${game.date}-${index}`}
            className="grid grid-cols-6 gap-0 border-t border-[hsl(var(--ve-border)/0.18)] px-3 py-2 text-xs"
            style={{ background: index % 2 === 0 ? 'hsl(var(--ve-bg-panel))' : 'hsl(var(--ve-surface))' }}
          >
            <span className="truncate font-semibold text-[hsl(var(--ve-text-muted))]">{game.date.slice(5)}</span>
            <span className="text-right tabular-nums text-[hsl(var(--ve-text-muted))]">{game.ab}</span>
            <span className="text-right tabular-nums">{game.hits}</span>
            <span className={`text-right font-bold tabular-nums ${game.homeRuns > 0 ? 'text-amber-400' : ''}`}>
              {game.homeRuns || '—'}
            </span>
            <span className="text-right tabular-nums">{game.rbi}</span>
            <span className="text-right tabular-nums text-cyan-300/90">{game.totalBases}</span>
          </div>
        ))}
      </div>
    </ProGraphShell>
  );
});

const PowerQualityGraph: React.FC<{ research: PlayerEdgeResearchPayload }> = React.memo(function PowerQualityGraph({ research }) {
  const sc = research.statcast;

  const signals = useMemo(() => {
    if (!sc) return [];
    return [
      { key: 'barrel', label: 'Barrel %', value: sc.barrelPct, max: 25, color: ACCENT.power },
      { key: 'hardHit', label: 'Hard-Hit %', value: sc.hardHitPct, max: 60, color: ACCENT.form },
      { key: 'xwoba', label: 'xwOBA ×100', value: sc.xwoba != null ? sc.xwoba * 100 : null, max: 45, color: ACCENT.matchup },
      { key: 'ev', label: 'Avg Exit Velo', value: sc.avgExitVelo, max: 100, color: ACCENT.emerald },
    ];
  }, [sc]);

  if (!sc) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        sectionTitle="Power Quality"
        title="Statcast unavailable"
        detail="Season Statcast quality requires Baseball Savant leaderboard data. Zone heatmaps are not fabricated when this feed is missing."
      />
    );
  }

  return (
    <SignalGraph
      icon={Zap}
      title="Power Quality (Statcast)"
      subtitle={`Season sample · ${sc.pa ?? '—'} PA · Baseball Savant`}
      accent={ACCENT.power}
      signals={signals}
      footer="Season-level barrel %, hard-hit %, xwOBA, and avg exit velo. Not a pitch-location zone heatmap — real Savant leaderboards only."
    />
  );
});

const HrEdgeTrendGraph: React.FC<{ research: PlayerEdgeResearchPayload }> = React.memo(function HrEdgeTrendGraph({ research }) {
  const recent = research.gameLog.slice(0, 10);

  if (!recent.length) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        sectionTitle="HR Edge Trend"
        title="No game trend data"
        detail="Recent HR production trend requires MLB game logs."
      />
    );
  }

  const reversed = [...recent].reverse();
  const hrRate = reversed.map((g) => (g.ab > 0 ? (g.homeRuns / g.ab) * 100 : 0));
  const slugApprox = reversed.map((g) => (g.ab > 0 ? (g.totalBases / g.ab) * 100 : 0));

  return (
    <ProGraphShell
      icon={Activity}
      title="HR Edge Trend"
      subtitle="Last 10 games · MLB game log"
      accent={ACCENT.final}
      footer={`${fmtDecimal(recent.reduce((s, g) => s + g.homeRuns, 0) / Math.max(1, recent.length))} HR/game avg over window. Derived from real box scores, not a proprietary model replay.`}
    >
      <div className="space-y-2.5">
        <ProSignalBar
          label="Latest game HR rate"
          value={hrRate[hrRate.length - 1] ?? null}
          max={50}
          color={ACCENT.power}
        />
        <ProSignalBar
          label="Latest game SLG proxy (TB/AB)"
          value={slugApprox[slugApprox.length - 1] ?? null}
          max={200}
          color={ACCENT.form}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--ve-text-muted))]">HR rate</div>
          <MiniSparkline values={hrRate} color="#f59e0b" />
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--ve-text-muted))]">SLG proxy</div>
          <MiniSparkline values={slugApprox} color="#10b981" />
        </div>
      </div>
    </ProGraphShell>
  );
});

export const PlayerEdgeGraphs: React.FC<PlayerEdgeGraphsProps> = React.memo(function PlayerEdgeGraphs({
  research,
  loading = false,
  error = null,
  pitcherName,
  opponent,
  className = '',
}) {
  if (loading) {
    return (
      <div className={`grid gap-4 lg:grid-cols-2 ${className}`}>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/45">Loading MLB research graphs…</div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-white/45">Loading MLB research graphs…</div>
      </div>
    );
  }

  if (error) {
    return (
      <VerifiedGraphEmptyState
        variant="feed-required"
        title="MLB research feed unavailable"
        detail={`${error}. No fake BvP, team trends, or zone data shown.`}
        className={className}
      />
    );
  }

  if (!research) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        title="Select a player"
        detail="Choose a verified HR board player to load MLB API research graphs."
        className={className}
      />
    );
  }

  return (
    <div className={`grid gap-4 lg:grid-cols-2 ${className}`}>
      <BatterVsPitcherGraph research={research} pitcherName={pitcherName} />
      <VsTeamTrendsGraph research={research} opponent={opponent} />
      <PowerQualityGraph research={research} />
      <HrEdgeTrendGraph research={research} />
    </div>
  );
});

export default PlayerEdgeGraphs;
