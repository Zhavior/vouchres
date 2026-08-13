import { useState } from 'react';
import {
  AuroraMaxControl,
  AuroraMaxEvidenceLadder,
  AuroraMaxFallback,
  AuroraMaxScoreBadge,
  AuroraMaxTruthBadge,
} from '../../components/aurora-max/AuroraMaxPrimitives';
import { hasTierAccess } from '../../components/pro/proAccessUtils';
import { useAppProfile } from '../../context/AppShellContext';
import { useHrResearch } from '../hr/hooks/useHrResearch';
import type { HrWatchRow } from '../hr/types/hrWatch';
import { formatPct } from './format';
import { truthLabel, truthState } from './truth';

type ResearchTab = 'overview' | 'layers' | 'matchup' | 'form';

interface ResearchOverlayProps {
  player: HrWatchRow;
  date: string;
  onClose: () => void;
  onAddToSlip?: (player: HrWatchRow) => void;
}

export function ResearchOverlay({ player, date, onClose, onAddToSlip }: ResearchOverlayProps) {
  const [tab, setTab] = useState<ResearchTab>('overview');
  const profile = useAppProfile();
  const { research, loading, error } = useHrResearch(player.playerId, date, player.playerId != null);

  return (
    <div className="hr-intel-v2-overlay" role="presentation">
      <button type="button" className="absolute inset-0" aria-label="Close research" onClick={onClose} />
      <section className="hr-intel-v2-overlay__panel relative z-[1]" role="dialog" aria-modal="true" aria-label={`${player.playerName} research`}>
        <header className="flex items-start justify-between gap-3 border-b border-[var(--aurora-max-line)] px-4 py-3">
          <div className="min-w-0">
            <p className="aurora-max-eyebrow">Player research</p>
            <h2 className="truncate text-xl font-black tracking-[-0.03em]">{player.playerName}</h2>
            <p className="text-[11px] text-white/45">{player.team} vs {player.opponent}</p>
          </div>
          <div className="flex items-center gap-2">
            <AuroraMaxScoreBadge score={Math.round(player.hrScore)} />
            <AuroraMaxControl onClick={onClose}>Close</AuroraMaxControl>
          </div>
        </header>
        <nav className="hr-intel-v2-tabs border-b border-[var(--aurora-max-line)] px-3 py-2" aria-label="Research sections">
          {(['overview', 'layers', 'matchup', 'form'] as const).map((id) => (
            <AuroraMaxControl key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
              {id === 'layers' ? '12 Layers' : id[0].toUpperCase() + id.slice(1)}
            </AuroraMaxControl>
          ))}
        </nav>
        <div className="hr-intel-v2-overlay__body">
          {tab === 'overview' ? (
            <OverviewPane player={player} loading={loading} error={error} summary={research?.decision.summary ?? player.reasons[0] ?? null} />
          ) : null}
          {tab === 'layers' ? (
            hasTierAccess(profile, 'GOLD') ? (
              <LayersPane
                contributions={research?.charts.scoreContributions ?? []}
                loading={loading}
              />
            ) : (
              <AuroraMaxFallback
                title="12-Layer Intelligence is a Pro research tool"
                detail="Full weighted signal breakdown stays behind the existing subscription gate. Open beta still unlocks it when that flag is on."
              />
            )
          ) : null}
          {tab === 'matchup' ? (
            <MatchupPane
              pitcher={research?.matchup.pitcher.name ?? player.pitcherName ?? null}
              bvp={research?.context.batterVsPitcher ?? null}
              arsenal={research?.charts.pitchArsenal ?? []}
              loading={loading}
              error={error}
            />
          ) : null}
          {tab === 'form' ? (
            <FormPane points={research?.charts.signalTimeline ?? []} loading={loading} />
          ) : null}
        </div>
        {onAddToSlip ? (
          <footer className="border-t border-[var(--aurora-max-line)] px-4 py-3">
            <AuroraMaxControl tone="primary" disabled={player.truthStatus === 'blocked'} onClick={() => onAddToSlip(player)}>
              Choose HR prop
            </AuroraMaxControl>
          </footer>
        ) : null}
      </section>
    </div>
  );
}

function OverviewPane({
  player,
  loading,
  error,
  summary,
}: {
  player: HrWatchRow;
  loading: boolean;
  error: string | null;
  summary: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <AuroraMaxTruthBadge state={truthState(player.truthStatus)}>{truthLabel(player.truthStatus)}</AuroraMaxTruthBadge>
        {player.dataConfidence != null ? (
          <AuroraMaxTruthBadge state="live">Confidence {Math.round(player.dataConfidence)}</AuroraMaxTruthBadge>
        ) : (
          <AuroraMaxTruthBadge state="missing">Confidence missing</AuroraMaxTruthBadge>
        )}
      </div>
      <p className="text-sm leading-6 text-white/70">{summary ?? (loading ? 'Loading research snapshot…' : 'No model rationale was supplied for this signal.')}</p>
      {error ? <p className="text-xs text-[rgba(240,201,143,0.9)]">{error}</p> : null}
      <AuroraMaxEvidenceLadder
        items={[
          { label: 'Power', value: fmt(player.hitterPower), score: player.hitterPower, tone: tone(player.hitterPower) },
          { label: 'Pitcher', value: fmt(player.pitcherVulnerability), score: player.pitcherVulnerability, tone: tone(player.pitcherVulnerability) },
          { label: 'Park', value: fmt(player.parkFactor), score: player.parkFactor, tone: tone(player.parkFactor) },
          { label: 'Form', value: fmt(player.recentForm), score: player.recentForm, tone: tone(player.recentForm) },
          { label: 'Model HR%', value: formatPct(player.hrProbability), score: player.hrProbability == null ? null : player.hrProbability <= 1 ? player.hrProbability * 100 : player.hrProbability, tone: tone(player.hrProbability) },
        ]}
      />
    </div>
  );
}

function LayersPane({
  contributions,
  loading,
}: {
  contributions: readonly { key: string; label: string; score: number | null; explanation: string }[];
  loading: boolean;
}) {
  if (loading && contributions.length === 0) {
    return <AuroraMaxFallback compact title="Loading layers" detail="Weighted contributions are coming from the research snapshot." />;
  }
  if (contributions.length === 0) {
    return <AuroraMaxFallback title="Layer breakdown unavailable" detail="The research snapshot did not return score contributions. Missing evidence is shown, not invented." />;
  }
  return (
    <AuroraMaxEvidenceLadder
      items={contributions.map((item) => ({
        label: item.label,
        value: fmt(item.score),
        score: item.score,
        tone: tone(item.score),
      }))}
    />
  );
}

function MatchupPane({
  pitcher,
  bvp,
  arsenal,
  loading,
  error,
}: {
  pitcher: string | null;
  bvp: Record<string, number | string | null> | null;
  arsenal: readonly { pitchName: string; matchupScore: number | null; sampleSize: number | null }[];
  loading: boolean;
  error: string | null;
}) {
  const hasBvp = bvp != null && Object.keys(bvp).length > 0;
  if (loading && !hasBvp && arsenal.length === 0) {
    return <AuroraMaxFallback compact title="Loading matchup" detail="Official batter-versus-pitcher evidence is still arriving." />;
  }
  if (!hasBvp && arsenal.length === 0) {
    return (
      <AuroraMaxFallback
        title={`No recorded BvP vs ${pitcher ?? 'this pitcher'}`}
        detail={error ?? 'This is missing evidence, not a negative matchup signal. Simulated BvP is not shown.'}
      />
    );
  }
  return (
    <div className="space-y-4">
      {hasBvp ? (
        <dl className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(bvp).slice(0, 8).map(([key, value]) => (
            <div key={key} className="border border-[var(--aurora-max-line)] px-3 py-2">
              <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">{key}</dt>
              <dd className="mt-1 font-bold">{value == null || value === '' ? '—' : String(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {arsenal.length > 0 ? (
        <AuroraMaxEvidenceLadder
          meta="Pitch arsenal"
          items={arsenal.slice(0, 8).map((row) => ({
            label: row.pitchName,
            value: row.matchupScore == null ? `n=${row.sampleSize ?? 0}` : Math.round(row.matchupScore),
            score: row.matchupScore,
            tone: tone(row.matchupScore),
          }))}
        />
      ) : null}
    </div>
  );
}

function FormPane({
  points,
  loading,
}: {
  points: readonly { date: string; opponent: string | null; homeRuns: number; hrScore: number | null }[];
  loading: boolean;
}) {
  if (loading && points.length === 0) {
    return <AuroraMaxFallback compact title="Loading form" detail="Recent game-log evidence is still arriving." />;
  }
  if (points.length === 0) {
    return <AuroraMaxFallback title="No recent game log" detail="Form stays empty until verified games are present." />;
  }
  return (
    <AuroraMaxEvidenceLadder
      items={points.slice(-12).reverse().map((point) => ({
        label: `${point.date.slice(5)} vs ${point.opponent ?? '—'}`,
        value: point.homeRuns > 0 ? `${point.homeRuns} HR` : '0 HR',
        score: point.hrScore,
        tone: point.homeRuns > 0 ? 'confirmed' : 'neutral',
      }))}
    />
  );
}

function fmt(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? '—' : String(Math.round(value));
}

function tone(value: number | null | undefined): 'confirmed' | 'missing' | 'neutral' {
  return value == null || !Number.isFinite(value) ? 'missing' : 'confirmed';
}
