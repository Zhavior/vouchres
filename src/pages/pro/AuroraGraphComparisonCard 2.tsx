import PlayerHeadshot from '../../components/parlays/PlayerHeadshot';
import { AURORA_LABEL, AURORA_SURFACE } from '../../theme/auroraTokens';
import {
  formatGraphMetric,
  lineupStatusLabel,
  type AuroraGraphCandidate,
} from './proGraphsPresentation';

interface AuroraGraphComparisonCardProps {
  candidate: AuroraGraphCandidate;
  label: 'Player A' | 'Player B';
}

const METRICS = [
  ['hrEdge', 'HR Edge score'],
  ['hitterPower', 'Hitter power index'],
  ['pitcherVulnerability', 'Pitcher vulnerability'],
  ['parkFactor', 'Park HR factor'],
] as const;

export function AuroraGraphComparisonCard({
  candidate,
  label,
}: AuroraGraphComparisonCardProps) {
  const matchup = [candidate.team, candidate.opponent ? `vs ${candidate.opponent}` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={`${AURORA_SURFACE} min-w-0 p-4`} aria-label={`${label}: ${candidate.name}`}>
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <PlayerHeadshot name={candidate.name} playerId={candidate.playerId} size={42} />
        <div className="min-w-0 flex-1">
          <div className={`${AURORA_LABEL} text-vouch-cyan`}>{label}</div>
          <h3 className="mt-1 truncate text-sm font-black text-white">{candidate.name}</h3>
          <p className="mt-1 truncate text-xs text-white/45">{matchup || 'Matchup unavailable'}</p>
        </div>
        {candidate.grade ? (
          <span className="border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-xs font-bold text-white/70">
            Grade {candidate.grade}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-xs text-white/45">{lineupStatusLabel(candidate.lineupStatus)}</p>

      <dl className="mt-3 space-y-2 font-mono text-xs">
        {METRICS.map(([key, metricLabel]) => (
          <div key={key} className="flex items-center justify-between gap-4 border-t border-white/5 pt-2 first:border-t-0 first:pt-0">
            <dt className="text-white/45">{metricLabel}</dt>
            <dd className="text-right font-bold text-white">
              {formatGraphMetric(candidate.metrics[key])}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
