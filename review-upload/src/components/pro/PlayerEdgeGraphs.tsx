/**
 * PlayerEdgeGraphs — MLB API-backed research graphs for Player Edge Lab.
 * Replaces placeholder ProLockedCards with honest real/empty states.
 */
import React, { useMemo } from 'react';
import { Activity, CloudRain, Crosshair, Layers, MapPin, Target, Users, Zap } from 'lucide-react';
import { ACCENT } from '../../theme/colors';
import { ProGraphShell } from './ProGraphShell';
import { ProSignalBar } from './ProSignalBar';
import { SignalGraph } from './SignalGraph';
import { VerifiedGraphEmptyState } from './VerifiedGraphEmptyState';
import { StatChip, fmtDecimal, fmtInt, fmtPercent } from '../ui/primitives';
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
        <span className="rounded-full border border-vouch-emerald/30 bg-vouch-emerald/10 px-2 py-0.5 font-mono text-[10px] font-black text-vouch-emerald">
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
        <span className="rounded-full border border-vouch-cyan/30 bg-vouch-cyan/10 px-2 py-0.5 font-mono text-[10px] font-black text-vouch-cyan">
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

const SprayDirectionField: React.FC<{
  pullPct: number;
  straightPct: number;
  oppoPct: number;
}> = React.memo(function SprayDirectionField({ pullPct, straightPct, oppoPct }) {
  const total = Math.max(pullPct + straightPct + oppoPct, 0.01);
  const pull = pullPct / total;
  const straight = straightPct / total;
  const oppo = oppoPct / total;

  return (
    <svg viewBox="0 0 120 90" width="140" height="105" className="opacity-95" aria-hidden>
      <path d="M60,78 L15,35 Q60,8 105,35 Z" fill="rgba(34,211,238,0.06)" stroke="hsl(var(--ve-border)/0.45)" strokeWidth="1" />
      <path d="M60,78 L60,18" stroke="hsl(var(--ve-border)/0.35)" strokeWidth="0.75" strokeDasharray="3 3" />
      <path
        d={`M60,78 L15,35 A55,55 0 0,1 ${60 - 55 * Math.sin(Math.PI * pull)} ${78 - 55 * Math.cos(Math.PI * pull)} Z`}
        fill="rgba(245,158,11,0.35)"
      />
      <path
        d={`M60,78 L${60 - 55 * Math.sin(Math.PI * pull)} ${78 - 55 * Math.cos(Math.PI * pull)} A55,55 0 0,1 ${60 + 55 * Math.sin(Math.PI * straight)} ${78 - 55 * Math.cos(Math.PI * straight)} Z`}
        fill="rgba(16,185,129,0.28)"
      />
      <path
        d={`M60,78 L${60 + 55 * Math.sin(Math.PI * straight)} ${78 - 55 * Math.cos(Math.PI * straight)} A55,55 0 0,1 105,35 Z`}
        fill="rgba(129,140,248,0.32)"
      />
      <text x="22" y="58" fontSize="8" fill="#f59e0b" fontWeight="700">Pull</text>
      <text x="54" y="24" fontSize="8" fill="#10b981" fontWeight="700">Mid</text>
      <text x="88" y="58" fontSize="8" fill="#818cf8" fontWeight="700">Oppo</text>
      <circle cx="60" cy="78" r="3" fill="hsl(var(--ve-text-muted))" />
    </svg>
  );
});

const SprayProfileGraph: React.FC<{ research: PlayerEdgeResearchPayload }> = React.memo(function SprayProfileGraph({ research }) {
  const spray = research.sprayProfile;

  if (!spray?.bbe) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        sectionTitle="Spray Profile"
        title="No Savant spray data"
        detail="Baseball Savant batted-ball profile did not return pull / middle / opposite rates for this batter."
      />
    );
  }

  const pull = spray.pullPct ?? 0;
  const straight = spray.straightPct ?? 0;
  const oppo = spray.oppoPct ?? 0;

  return (
    <ProGraphShell
      icon={MapPin}
      title="Spray Profile"
      subtitle={`Season batted balls · ${spray.bbe} BBE · Savant`}
      accent={ACCENT.power}
      right={
        <span className="rounded-full border border-vouch-amber/30 bg-vouch-amber/10 px-2 py-0.5 font-mono text-[10px] font-black text-vouch-amber">
          {fmtPercent(spray.pullAirPct != null ? spray.pullAirPct / 100 : null)} pull air
        </span>
      }
      footer="Directional rates from Savant Batted Ball Profile. Season aggregates — not a pitch-by-pitch spray chart."
    >
      <div className="flex flex-wrap items-start gap-4">
        <SprayDirectionField pullPct={pull} straightPct={straight} oppoPct={oppo} />
        <div className="min-w-[160px] flex-1 space-y-2.5">
          <ProSignalBar label="Pull %" value={pull} max={60} color="#f59e0b" />
          <ProSignalBar label="Middle %" value={straight} max={60} color={ACCENT.emerald} />
          <ProSignalBar label="Opposite %" value={oppo} max={60} color="#818cf8" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatChip label="GB%" value={fmtPercent(spray.gbPct != null ? spray.gbPct / 100 : null)} color={ACCENT.form} />
        <StatChip label="FB%" value={fmtPercent(spray.fbPct != null ? spray.fbPct / 100 : null)} color={ACCENT.power} />
        <StatChip label="LD%" value={fmtPercent(spray.ldPct != null ? spray.ldPct / 100 : null)} color={ACCENT.matchup} />
      </div>
    </ProGraphShell>
  );
});

const PitchMixGraph: React.FC<{ research: PlayerEdgeResearchPayload }> = React.memo(function PitchMixGraph({ research }) {
  const mix = research.pitchMix.slice(0, 6);

  if (!mix.length) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        sectionTitle="Pitch Type Matchup"
        title="No Savant pitch mix"
        detail="Baseball Savant pitch arsenal stats did not return pitch-type rows for this batter."
      />
    );
  }

  const signals = mix.map((row) => ({
    key: row.pitchType,
    label: row.pitchName,
    value: row.pitchUsage,
    max: 45,
    color: ACCENT.matchup,
    hint: row.xwoba != null ? `xwOBA ${row.xwoba.toFixed(3)}` : undefined,
  }));

  return (
    <SignalGraph
      icon={Layers}
      title="Pitch Type Matchup"
      subtitle="Season usage vs pitch types · Savant"
      accent={ACCENT.matchup}
      signals={signals}
      right={
        <span className="rounded-full border border-vouch-cyan/30 bg-vouch-cyan/10 px-2 py-0.5 font-mono text-[10px] font-black text-vouch-cyan">
          {mix.length} types
        </span>
      }
      footer="Pitch usage % and xwOBA from Savant Pitch Arsenal Stats. Not simulated pitcher-tendency guesses."
    />
  );
});

const PlateDisciplineGraph: React.FC<{ research: PlayerEdgeResearchPayload }> = React.memo(function PlateDisciplineGraph({ research }) {
  const d = research.plateDiscipline;

  if (!d) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        sectionTitle="Batter Box / Plate Discipline"
        title="No Savant discipline data"
        detail="Percentile-rankings feed did not return chase, whiff, or walk rates for this batter."
      />
    );
  }

  return (
    <ProGraphShell
      icon={Crosshair}
      title="Batter Box / Plate Discipline"
      subtitle="Season chase & contact rates · Savant"
      accent={ACCENT.confidence}
      footer="Chase and whiff rates from Savant percentile leaderboards. This is not a strike-zone heatmap — zone grids are not fabricated."
    >
      <div className="space-y-2.5">
        <ProSignalBar label="Chase %" value={d.chasePct} max={40} color={ACCENT.risk} />
        <ProSignalBar label="Whiff %" value={d.whiffPct} max={40} color={ACCENT.form} />
        <ProSignalBar label="K %" value={d.kPct} max={40} color={ACCENT.risk} />
        <ProSignalBar label="BB %" value={d.bbPct} max={20} color={ACCENT.emerald} />
      </div>
    </ProGraphShell>
  );
});

const ZoneHeatmapGraph: React.FC = React.memo(function ZoneHeatmapGraph() {
  return (
    <VerifiedGraphEmptyState
      variant="feed-required"
      sectionTitle="Hot/Cold Zone Heatmap"
      title="Zone heatmap unavailable"
      detail="Per-zone wOBA grids need pitch-by-pitch Statcast aggregation. Savant bulk zone exports time out at request scale, so VouchEdge does not paint fake hot/cold zones."
    />
  );
});

const Rolling14DayGraph: React.FC<{ research: PlayerEdgeResearchPayload }> = React.memo(function Rolling14DayGraph({ research }) {
  const rolling = research.rolling14Day;

  if (!rolling) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        sectionTitle="Rolling 14-Day Edge"
        title="No rolling window"
        detail="Rolling 14-day HR edge needs MLB game logs for this season."
      />
    );
  }

  const hrRatePct = rolling.hrRate != null ? rolling.hrRate * 100 : null;
  const slugPct = rolling.slugProxy != null ? rolling.slugProxy * 100 : null;

  return (
    <ProGraphShell
      icon={Activity}
      title="Rolling 14-Day Edge"
      subtitle={`Last ${rolling.games} games · MLB game log`}
      accent={ACCENT.final}
      right={
        <span className="rounded-full border border-vouch-amber/30 bg-vouch-amber/10 px-2 py-0.5 font-mono text-[10px] font-black text-vouch-amber">
          {rolling.homeRuns} HR
        </span>
      }
      footer="HR rate and SLG proxy (TB/AB) over the latest 14 logged games. Derived from real box scores."
    >
      <div className="mb-3 grid grid-cols-4 gap-2">
        <StatChip label="G" value={fmtInt(rolling.games)} color={ACCENT.form} />
        <StatChip label="AB" value={fmtInt(rolling.atBats)} color="hsl(var(--ve-text-muted))" />
        <StatChip label="HR" value={fmtInt(rolling.homeRuns)} color={ACCENT.power} />
        <StatChip label="H" value={fmtInt(rolling.hits)} color={ACCENT.emerald} />
      </div>
      <div className="space-y-2.5">
        <ProSignalBar label="HR / AB" value={hrRatePct} max={25} color={ACCENT.power} />
        <ProSignalBar label="SLG proxy (TB/AB)" value={slugPct} max={120} color={ACCENT.form} />
        <ProSignalBar
          label="HR / game"
          value={rolling.avgHrPerGame != null ? rolling.avgHrPerGame * 100 : null}
          max={50}
          color={ACCENT.final}
          hint={rolling.avgHrPerGame != null ? rolling.avgHrPerGame.toFixed(2) : undefined}
        />
      </div>
    </ProGraphShell>
  );
});

const WeatherImpactGraph: React.FC<{ research: PlayerEdgeResearchPayload }> = React.memo(function WeatherImpactGraph({ research }) {
  const w = research.weather;

  if (!w) {
    return (
      <VerifiedGraphEmptyState
        variant="feed-required"
        sectionTitle="Weather Impact"
        title="No game weather context"
        detail="Today's gamePk is required to attach a verified Open-Meteo forecast. No wind-in/out claims are fabricated."
      />
    );
  }

  if (w.status === 'indoor') {
    return (
      <ProGraphShell
        icon={CloudRain}
        title="Weather Impact"
        subtitle={w.venue}
        accent={ACCENT.slate}
        footer={w.note}
      >
        <div className="rounded-xl border border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-bg-panel)/0.5)] px-4 py-6 text-center text-sm text-[hsl(var(--ve-text-muted))]">
          Fixed roof — outdoor weather is not a factor at {w.venue}.
        </div>
      </ProGraphShell>
    );
  }

  if (w.status === 'unavailable') {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        sectionTitle="Weather Impact"
        title="Forecast unavailable"
        detail={w.note}
      />
    );
  }

  const windLabel = w.windMph != null && w.windCompass ? `${w.windMph} mph ${w.windCompass}` : '—';

  return (
    <ProGraphShell
      icon={CloudRain}
      title="Weather Impact"
      subtitle={`${w.venue} · first pitch forecast`}
      accent={ACCENT.lineup}
      right={
        <span className="rounded-full border border-vouch-cyan/30 bg-vouch-cyan/10 px-2 py-0.5 font-mono text-[10px] font-black text-vouch-cyan">
          {w.status === 'retractable' ? 'Retractable roof' : 'Open air'}
        </span>
      }
      footer={`${w.note} Wind direction only — blowing in/out is not claimed without stadium orientation data.`}
    >
      <div className="grid grid-cols-3 gap-2">
        <StatChip label="Temp" value={w.tempF != null ? `${w.tempF}°F` : '—'} color={ACCENT.form} />
        <StatChip label="Wind" value={windLabel} color={ACCENT.matchup} />
        <StatChip
          label="Precip"
          value={w.precipChancePct != null ? `${Math.round(w.precipChancePct)}%` : '—'}
          color={ACCENT.risk}
        />
      </div>
    </ProGraphShell>
  );
});

const PlayerTrendGraph: React.FC<{ research: PlayerEdgeResearchPayload }> = React.memo(function PlayerTrendGraph({ research }) {
  const recent = research.gameLog.slice(0, 10);

  if (!recent.length) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        sectionTitle="Player Trend"
        title="No game trend data"
        detail="Recent production trend requires MLB game logs."
      />
    );
  }

  const reversed = [...recent].reverse();
  const hrRate = reversed.map((g) => (g.ab > 0 ? (g.homeRuns / g.ab) * 100 : 0));
  const slugApprox = reversed.map((g) => (g.ab > 0 ? (g.totalBases / g.ab) * 100 : 0));

  return (
    <ProGraphShell
      icon={Activity}
      title="Player Trend"
      subtitle="Last 10 games · HR rate & power proxy"
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
      <PlayerTrendGraph research={research} />
      <SprayProfileGraph research={research} />
      <PitchMixGraph research={research} />
      <PlateDisciplineGraph research={research} />
      <Rolling14DayGraph research={research} />
      <WeatherImpactGraph research={research} />
      <div className="lg:col-span-2">
        <ZoneHeatmapGraph />
      </div>
    </div>
  );
});

export default PlayerEdgeGraphs;
