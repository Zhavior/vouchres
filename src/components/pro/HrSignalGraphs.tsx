/**
 * HrSignalGraphs.tsx — The 5 premium graph sections, normalized.
 *
 * Uses shared helpers from ui/primitives.tsx (StatChip, fmtInt, etc.)
 * and ACCENT from theme/colors.ts (not from normalized types).
 *
 * Field names match backend (hrEdge, not edgeScore) — no dual vocabulary.
 */

import React from 'react';
import { BarChart3, Activity, Zap, Gauge, Lock } from 'lucide-react';
import type { NormalizedPlayerPayload } from '../../adapters/normalized';
import { ACCENT, withAlpha } from '../../theme/colors';
import { ProGraphShell } from './ProGraphShell';
import { ProSignalBar } from './ProSignalBar';
import { ProLockedCard } from './ProLockedCard';
import { VerifiedGraphEmptyState } from './VerifiedGraphEmptyState';
import { StatChip, fmtInt, fmtDecimal, fmtPercent, isFiniteNumber } from '../ui/primitives';

export interface HrSignalGraphsProps {
  payload: NormalizedPlayerPayload | null;
  showAll?: boolean;
  className?: string;
}

/* ============================================================================
   Section 1: Edge Score Breakdown
   ============================================================================ */

const EdgeScoreBreakdown: React.FC<{ payload: NormalizedPlayerPayload }> = React.memo(function EdgeScoreBreakdown({ payload }) {
  const { player, scoreBreakdown: b } = payload;

  if (!b) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        sectionTitle="Edge Score Breakdown"
        title="Score breakdown unavailable"
        detail="The HR Engine payload did not include scoreBreakdown for this player."
      />
    );
  }

  return (
    <ProGraphShell
      icon={BarChart3}
      title="Edge Score Breakdown"
      subtitle="HR Engine Pro v2 live payload"
      accent={ACCENT.final}
      right={
        <span className="rounded-full border border-[hsl(var(--ve-accent-gold)/0.28)] bg-[hsl(var(--ve-accent-gold)/0.08)] px-2 py-0.5 font-mono text-[10px] font-black text-[hsl(var(--ve-accent-gold))]">
          HR {fmtInt(player.hrEdge)}
        </span>
      }
      footer="Live values from HR Engine Pro v2. No historical data is shown here — every field reads from the current scoring payload for this candidate."
    >
      <div className="space-y-2.5">
        <ProSignalBar label="Hitter Power" value={b.hitterPower ?? null} color={ACCENT.power} />
        <ProSignalBar label="Pitcher Vulnerability" value={b.pitcherVulnerability ?? null} color={ACCENT.matchup} />
        <ProSignalBar label="Park Factor" value={b.parkFactor ?? null} max={120} color={ACCENT.emerald} />
        <ProSignalBar label="Recent Form" value={b.recentForm ?? null} color={ACCENT.form} />
        <ProSignalBar label="Lineup Confidence" value={b.lineupConfidence ?? null} color={ACCENT.lineup} />
        <ProSignalBar label="Risk Penalty" value={b.riskPenalty ?? null} color={ACCENT.risk} />
        <div className="my-2 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--ve-border)/0.55),transparent)]" />
        <ProSignalBar label="Final Score" value={b.finalScore ?? player.hrEdge ?? null} color={ACCENT.final} />
      </div>
    </ProGraphShell>
  );
});

/* ============================================================================
   Section 2: Recent Power Snapshot
   ============================================================================ */

const RecentPowerSnapshot: React.FC<{ payload: NormalizedPlayerPayload }> = React.memo(function RecentPowerSnapshot({ payload }) {
  const { recentForm: f } = payload;

  if (!f) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        sectionTitle="Recent Power Snapshot"
        title="Recent form unavailable"
        detail="The HR Engine payload did not include recentForm for this player."
      />
    );
  }

  return (
    <ProGraphShell
      icon={Activity}
      title="Recent Power Snapshot"
      subtitle={`Last ${f.gamesChecked ?? 0} games · live from HR Engine`}
      accent={ACCENT.form}
      right={
        <span className="rounded-full border border-[hsl(var(--ve-accent-pink)/0.28)] bg-[hsl(var(--ve-accent-pink)/0.08)] px-2 py-0.5 font-mono text-[10px] font-black text-[hsl(var(--ve-accent-pink))]">
          PWR {fmtInt(f.recentPowerScore)}
        </span>
      }
      footer={`Sample window: ${fmtInt(f.gamesChecked)} games · ${fmtInt(f.atBats)} AB · ${fmtInt(f.hits)} H · ${fmtDecimal(f.slugging)} SLG · ${fmtDecimal(f.recentHrRate)} HR/AB. Game-by-game trend graphs are locked for Pro matchup history.`}
    >
      <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
        <StatChip label="G" value={fmtInt(f.gamesChecked)} color={ACCENT.form} />
        <StatChip label="AB" value={fmtInt(f.atBats)} color="hsl(var(--ve-text-muted))" />
        <StatChip label="H" value={fmtInt(f.hits)} color={ACCENT.matchup} />
        <StatChip label="HR" value={fmtInt(f.homeRuns)} color={ACCENT.power} />
        <StatChip label="XBH" value={fmtInt(f.extraBaseHits)} color={ACCENT.lineup} />
      </div>

      <div className="space-y-2.5">
        <ProSignalBar label="Slugging (SLG)" value={f.slugging ?? null} max={1} color={ACCENT.emerald} />
        <ProSignalBar label="Extra-Base Hits" value={f.extraBaseHits ?? null} max={15} color={ACCENT.lineup} />
        <ProSignalBar label="Total Bases" value={f.totalBases ?? null} max={60} color={ACCENT.power} />
        <ProSignalBar label="Recent HR Rate" value={f.recentHrRate ?? null} max={0.2} color={ACCENT.power} />
        <div className="my-2 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--ve-border)/0.55),transparent)]" />
        <ProSignalBar label="Recent Power Score" value={f.recentPowerScore ?? null} color={ACCENT.form} />
      </div>
    </ProGraphShell>
  );
});

/* ============================================================================
   Section 3: Matchup Signal Meter
   ============================================================================ */

const MatchupSignalMeter: React.FC<{ payload: NormalizedPlayerPayload }> = React.memo(function MatchupSignalMeter({ payload }) {
  const { matchup: m } = payload;

  if (!m) {
    return (
      <VerifiedGraphEmptyState
        variant="no-data"
        sectionTitle="Matchup Signal Meter"
        title="Matchup data unavailable"
        detail="The HR Engine payload did not include matchup context for this player."
      />
    );
  }

  const weatherBoostNum = isFiniteNumber(m.weatherBoost) ? (m.weatherBoost as number) : null;

  return (
    <ProGraphShell
      icon={Zap}
      title="Matchup Signal Meter"
      subtitle="Pitcher / Park / Weather composite"
      accent={ACCENT.matchup}
      right={
        <span className="rounded-full border border-[hsl(var(--ve-accent-cyan)/0.28)] bg-[hsl(var(--ve-accent-cyan)/0.08)] px-2 py-0.5 font-mono text-[10px] font-black text-[hsl(var(--ve-accent-cyan))]">
          P.VULN {fmtInt(m.pitcherVulnerability)}
        </span>
      }
      footer="Pitcher vulnerability comes from the live HR Engine. Park factor reflects the venue. Weather boost is null-safe — shows N/A when no weather feed is connected."
    >
      <div className="space-y-2.5">
        <ProSignalBar label="Pitcher Vulnerability" value={m.pitcherVulnerability ?? null} color={ACCENT.matchup} />
        <ProSignalBar label="Park Factor" value={m.parkFactor ?? null} max={120} color={ACCENT.emerald} />
        <ProSignalBar
          label="Weather Boost"
          value={weatherBoostNum}
          max={20}
          color={weatherBoostNum !== null && weatherBoostNum < 0 ? ACCENT.risk : ACCENT.lineup}
        />
        <ProSignalBar
          label="HR Multiplier"
          value={typeof m.hrMultiplier === 'number' ? m.hrMultiplier * 100 : null}
          max={150}
          color={ACCENT.power}
          hint={typeof m.hrMultiplier === 'string' ? m.hrMultiplier : undefined}
        />
      </div>
    </ProGraphShell>
  );
});

/* ============================================================================
   Section 4: Data Confidence / Preview Status
   ============================================================================ */

const DataConfidencePanel: React.FC<{ payload: NormalizedPlayerPayload }> = React.memo(function DataConfidencePanel({ payload }) {
  const { player, scoreBreakdown: b } = payload;
  const isPreview = player.lineupStatus === 'projected_unconfirmed';
  const isConfirmed = player.lineupStatus === 'confirmed';
  const statusColor = isConfirmed ? ACCENT.emerald : isPreview ? ACCENT.gold : 'hsl(var(--ve-text-muted))';
  const statusLabel = isConfirmed ? 'Confirmed' : isPreview ? 'Preview' : 'Projected';

  return (
    <ProGraphShell
      icon={Gauge}
      title="Data Confidence / Preview Status"
      subtitle="How solid is this read?"
      accent={ACCENT.confidence}
      right={
        <span
          className="rounded-full border px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider"
          style={{ color: statusColor, borderColor: withAlpha(statusColor, 0.28), background: withAlpha(statusColor, 0.08) }}
        >
          {statusLabel}
        </span>
      }
      footer={`Source: ${player.source ?? 'hr-engine'} · Quality: ${player.dataQuality ?? 'unknown'}. ${
        isPreview
          ? 'Official lineup not posted yet — this is a projection preview.'
          : isConfirmed
            ? 'Lineup confirmed for today.'
            : 'Lineup status pending.'
      }`}
    >
      <div className="mb-3 grid grid-cols-3 gap-2">
        <StatChip label="Data Conf" value={fmtPercent(player.dataConfidence)} color={ACCENT.confidence} />
        <StatChip label="Lineup Conf" value={fmtPercent(b?.lineupConfidence)} color={ACCENT.lineup} />
        <StatChip label="Risk Penalty" value={fmtInt(b?.riskPenalty)} color={ACCENT.risk} />
      </div>

      <div className="space-y-2.5">
        <ProSignalBar label="Data Confidence" value={player.dataConfidence ?? null} color={ACCENT.confidence} />
        <ProSignalBar label="Lineup Confidence" value={b?.lineupConfidence ?? null} color={ACCENT.lineup} />
        <ProSignalBar label="Risk Penalty" value={b?.riskPenalty ?? null} color={ACCENT.risk} />
      </div>
    </ProGraphShell>
  );
});

/* ============================================================================
   Section 5: Locked Future Graphs — always locked, never faked
   ============================================================================ */

const FUTURE_GRAPHS = [
  { title: 'Last 10 games vs team', detail: 'Coming soon with Pro matchup history feed.' },
  { title: 'Batter vs pitcher history', detail: 'Requires Pro historical research module.' },
  { title: 'Batter box percentage', detail: 'Requires zone heatmap module.' },
  { title: 'Pitch type matchup', detail: 'Requires pitch-type module.' },
  { title: 'Hot/cold zone heatmap', detail: 'Requires zone heatmap module.' },
  { title: 'Weather impact', detail: 'Requires weather impact module.' },
  { title: 'Player trend graph', detail: 'Coming soon with Pro data feed.' },
] as const;

const LockedFutureGraphs: React.FC = React.memo(function LockedFutureGraphs() {
  return (
    <ProGraphShell
      icon={Lock}
      title="Locked Future Graphs"
      subtitle="Pro research modules — no data fabricated"
      accent={ACCENT.slate}
      right={
        <span className="rounded-full border border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-bg-panel)/0.46)] px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-[hsl(var(--ve-text-muted))]">
          {FUTURE_GRAPHS.length} locked
        </span>
      }
      footer="Each card represents a future Pro research module. VouchEdge never invents matchup history, pitch types, hot/cold zones, or weather impact."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {FUTURE_GRAPHS.map((g) => (
          <ProLockedCard key={g.title} title={g.title} detail={g.detail} />
        ))}
      </div>
    </ProGraphShell>
  );
});

/* ============================================================================
   Composite — HrSignalGraphs
   ============================================================================ */

export const HrSignalGraphs: React.FC<HrSignalGraphsProps> = React.memo(function HrSignalGraphs({
  payload,
  showAll = true,
  className = '',
}) {
  if (!payload) {
    return (
      <div className={`grid gap-3 lg:grid-cols-2 ${className}`}>
        <VerifiedGraphEmptyState variant="no-data" sectionTitle="Edge Score Breakdown" />
        <VerifiedGraphEmptyState variant="no-data" sectionTitle="Recent Power Snapshot" />
        <VerifiedGraphEmptyState variant="no-data" sectionTitle="Matchup Signal Meter" />
        <VerifiedGraphEmptyState variant="no-data" sectionTitle="Data Confidence" />
        <div className="lg:col-span-2">
          <LockedFutureGraphs />
        </div>
      </div>
    );
  }

  if (!showAll) {
    return (
      <div className={`grid gap-3 ${className}`}>
        <EdgeScoreBreakdown payload={payload} />
        <RecentPowerSnapshot payload={payload} />
      </div>
    );
  }

  return (
    <div className={`grid gap-3 lg:grid-cols-2 ${className}`}>
      <EdgeScoreBreakdown payload={payload} />
      <RecentPowerSnapshot payload={payload} />
      <MatchupSignalMeter payload={payload} />
      <DataConfidencePanel payload={payload} />
      <div className="lg:col-span-2">
        <LockedFutureGraphs />
      </div>
    </div>
  );
});

export default HrSignalGraphs;
