import { useMemo, useState } from 'react';
import { Activity, BarChart3, Database, ShieldAlert, Users } from 'lucide-react';
import {
  HrSignalGraphs,
  ProPageHeader,
  VerifiedDataNotice,
  VerifiedGraphEmptyState,
} from '../../components/pro';
import PlayerHeadshot from '../../components/parlays/PlayerHeadshot';
import {
  AURORA_LABEL,
  AURORA_PAGE,
  AURORA_PAGE_GAP,
  AURORA_PAGE_PAD_X,
  AURORA_PANEL,
  AURORA_PANEL_PREMIUM,
  AURORA_SURFACE,
} from '../../theme/auroraTokens';
import { AuroraGraphComparisonCard } from './AuroraGraphComparisonCard';
import { buildPlayerPayload, useHrBoardProData } from './proLabData';
import {
  buildAuroraGraphCandidate,
  formatGraphMetric,
  lineupStatusLabel,
  type AuroraGraphCandidate,
} from './proGraphsPresentation';

interface ProGraphsLabPageZ8Props {
  embedded?: boolean;
}

const MAX_COMPARISON_CANDIDATES = 75;

function uniqueCandidates(rows: Record<string, any>[]): AuroraGraphCandidate[] {
  const candidates = rows.map((row) => buildAuroraGraphCandidate(row));
  return [...new Map(candidates.map((candidate) => [candidate.key, candidate])).values()];
}

export function ProGraphsLabPageZ8({ embedded = false }: ProGraphsLabPageZ8Props) {
  const { rows, groups, topRow, loading, error, source } = useHrBoardProData();
  const playerPayload = useMemo(() => buildPlayerPayload(topRow), [topRow]);
  const candidates = useMemo(() => uniqueCandidates(rows), [rows]);
  const topCandidates = useMemo(() => candidates.slice(0, 10), [candidates]);
  const comparisonCandidates = useMemo(
    () => candidates.slice(0, MAX_COMPARISON_CANDIDATES),
    [candidates],
  );
  const [playerAKey, setPlayerAKey] = useState<string | null>(null);
  const [playerBKey, setPlayerBKey] = useState<string | null>(null);

  const activePlayerA = comparisonCandidates.find((candidate) => candidate.key === playerAKey)
    ?? comparisonCandidates[0]
    ?? null;
  const activePlayerB = comparisonCandidates.find((candidate) => candidate.key === playerBKey)
    ?? comparisonCandidates[1]
    ?? comparisonCandidates[0]
    ?? null;
  const activeMatchupGroup = groups[0] ?? null;
  const pitcherInputs = topCandidates.filter(
    (candidate) =>
      candidate.pitcherName !== null && candidate.metrics.pitcherVulnerability !== null,
  ).slice(0, 3);

  return (
    <main
      className={
        embedded
          ? 'min-w-0 font-z8 text-white'
          : `${AURORA_PAGE} ${AURORA_PAGE_PAD_X} py-6 pb-24 text-white`
      }
    >
      <div className={AURORA_PAGE_GAP}>
        {!embedded ? (
          <ProPageHeader
            icon={BarChart3}
            title="Aurora Graph Lab"
            subtitle="Compare the current HR Board model outputs without filling missing evidence or turning presentation into a prediction engine."
            badge="Source-backed comparison"
          />
        ) : null}

        <VerifiedDataNotice
          variant={source === 'network' ? 'no-data' : 'feed-required'}
          title={
            loading
              ? 'Loading HR Board feed'
              : source === 'network'
                ? 'HR Board feed available'
                : 'HR Board feed unavailable'
          }
          detail={
            error
              ? `${error}. Missing values remain unavailable.`
              : source === 'network'
                ? 'Charts use the current HR Board response. A feed freshness timestamp was not included.'
                : 'No graph values are generated while the production feed is unavailable.'
          }
        />

        <section className="space-y-3" aria-labelledby="aurora-current-candidate-title">
          <div className="flex items-center gap-2 px-1 text-vouch-cyan">
            <Activity className="h-4 w-4" aria-hidden="true" />
            <h2 id="aurora-current-candidate-title" className={AURORA_LABEL}>
              Current board leader inputs
            </h2>
          </div>
          {playerPayload ? (
            <HrSignalGraphs payload={playerPayload} showLockedFutureGraphs={false} />
          ) : (
            <VerifiedGraphEmptyState
              variant="feed-required"
              title="HR Board row required"
              detail="Aurora needs a current HR Board row before it can present model inputs."
            />
          )}
        </section>

        <section className={`${AURORA_PANEL_PREMIUM} space-y-4 p-4 sm:p-5`} aria-labelledby="aurora-board-ranking-title">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <div className={`${AURORA_LABEL} text-vouch-cyan`}>Current response</div>
              <h2 id="aurora-board-ranking-title" className="mt-1 text-base font-black text-white">
                HR Board ranking
              </h2>
            </div>
            <span className="border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-xs text-white/55">
              {topCandidates.length} shown
            </span>
          </div>

          {topCandidates.length ? (
            <ol className="space-y-2">
              {topCandidates.map((candidate, index) => {
                const score = candidate.metrics.hrEdge;
                const matchup = [
                  candidate.team,
                  candidate.opponent ? `vs ${candidate.opponent}` : null,
                ].filter(Boolean).join(' ');

                return (
                  <li key={candidate.key} className={`${AURORA_SURFACE} min-w-0 p-3`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-6 shrink-0 font-mono text-xs font-bold text-white/35">
                        {index + 1}
                      </span>
                      <PlayerHeadshot
                        name={candidate.name}
                        playerId={candidate.playerId}
                        size={40}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="truncate text-sm font-bold text-white">{candidate.name}</span>
                          {candidate.grade ? (
                            <span className="font-mono text-xs text-white/45">Grade {candidate.grade}</span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-xs text-white/40">
                          {matchup || 'Matchup unavailable'} · {lineupStatusLabel(candidate.lineupStatus)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={AURORA_LABEL}>HR edge</div>
                        <div className="mt-1 font-mono text-lg font-black text-white">
                          {formatGraphMetric(score)}
                        </div>
                      </div>
                    </div>

                    {score !== null ? (
                      <div className="mt-3 h-1.5 overflow-hidden bg-white/5" aria-hidden="true">
                        <div
                          className="h-full bg-vouch-cyan"
                          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                        />
                      </div>
                    ) : null}

                    <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-white/5 pt-3 text-xs sm:grid-cols-3">
                      <div>
                        <dt className="text-white/35">Hitter power</dt>
                        <dd className="mt-1 font-mono font-bold text-white">
                          {formatGraphMetric(candidate.metrics.hitterPower)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-white/35">Pitcher vulnerability</dt>
                        <dd className="mt-1 font-mono font-bold text-white">
                          {formatGraphMetric(candidate.metrics.pitcherVulnerability)}
                        </dd>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <dt className="text-white/35">Park factor</dt>
                        <dd className="mt-1 font-mono font-bold text-white">
                          {formatGraphMetric(candidate.metrics.parkFactor)}
                        </dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-white/45">No HR Board candidates are available.</p>
          )}
        </section>

        <section className={`${AURORA_PANEL_PREMIUM} space-y-5 p-4 sm:p-5`} aria-labelledby="aurora-player-comparison-title">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <Users className="h-5 w-5 text-vouch-cyan" aria-hidden="true" />
            <div>
              <div className={`${AURORA_LABEL} text-vouch-cyan`}>Inspect side by side</div>
              <h2 id="aurora-player-comparison-title" className="mt-1 text-base font-black text-white">
                Player input comparison
              </h2>
            </div>
          </div>

          {comparisonCandidates.length ? (
            <>
              <p className="text-sm leading-6 text-white/50">
                Comparing the top {comparisonCandidates.length} candidates from the current board response.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="aurora-player-a" className={`${AURORA_LABEL} text-white/50`}>
                    Player A
                  </label>
                  <select
                    id="aurora-player-a"
                    value={activePlayerA?.key ?? ''}
                    onChange={(event) => setPlayerAKey(event.target.value)}
                    className="mt-2 min-h-12 w-full border border-white/15 bg-black/60 px-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vouch-cyan/80"
                  >
                    {comparisonCandidates.map((candidate) => (
                      <option key={candidate.key} value={candidate.key}>
                        {candidate.name} — HR edge {formatGraphMetric(candidate.metrics.hrEdge)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="aurora-player-b" className={`${AURORA_LABEL} text-white/50`}>
                    Player B
                  </label>
                  <select
                    id="aurora-player-b"
                    value={activePlayerB?.key ?? ''}
                    onChange={(event) => setPlayerBKey(event.target.value)}
                    className="mt-2 min-h-12 w-full border border-white/15 bg-black/60 px-3 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vouch-cyan/80"
                  >
                    {comparisonCandidates.map((candidate) => (
                      <option key={candidate.key} value={candidate.key}>
                        {candidate.name} — HR edge {formatGraphMetric(candidate.metrics.hrEdge)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {activePlayerA && activePlayerB ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <AuroraGraphComparisonCard candidate={activePlayerA} label="Player A" />
                  <AuroraGraphComparisonCard candidate={activePlayerB} label="Player B" />
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-white/45">Two current board candidates are required for comparison.</p>
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className={`${AURORA_PANEL} space-y-4 p-4 sm:p-5`} aria-labelledby="aurora-slate-context-title">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <Database className="h-5 w-5 text-vouch-cyan" aria-hidden="true" />
              <h2 id="aurora-slate-context-title" className="text-sm font-black text-white">
                First available game group
              </h2>
            </div>
            <p className="text-sm leading-6 text-white/50">
              This is schedule context from the board response, not a separate pressure score.
            </p>
            {activeMatchupGroup ? (
              <dl className={`${AURORA_SURFACE} space-y-3 p-4 text-sm`}>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-white/40">Matchup</dt>
                  <dd className="text-right font-bold text-white">{activeMatchupGroup.matchup}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 border-t border-white/5 pt-3">
                  <dt className="text-white/40">Venue</dt>
                  <dd className="text-right text-white">{activeMatchupGroup.venue ?? 'Unavailable'}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 border-t border-white/5 pt-3">
                  <dt className="text-white/40">Ranked players</dt>
                  <dd className="font-mono font-bold text-white">{activeMatchupGroup.rows.length}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-white/45">No game group is available.</p>
            )}
          </section>

          <section className={`${AURORA_PANEL} space-y-4 p-4 sm:p-5`} aria-labelledby="aurora-pitcher-inputs-title">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <ShieldAlert className="h-5 w-5 text-vouch-amber" aria-hidden="true" />
              <h2 id="aurora-pitcher-inputs-title" className="text-sm font-black text-white">
                Available pitcher vulnerability inputs
              </h2>
            </div>
            <p className="text-sm leading-6 text-white/50">
              Values below are direct fields from the current candidates; unavailable pitchers are omitted.
            </p>
            {pitcherInputs.length ? (
              <dl className="space-y-2">
                {pitcherInputs.map((candidate) => (
                  <div key={candidate.key} className={`${AURORA_SURFACE} flex items-center justify-between gap-4 p-3 text-sm`}>
                    <dt className="min-w-0 truncate font-bold text-white">{candidate.pitcherName}</dt>
                    <dd className="shrink-0 font-mono font-bold text-white">
                      {formatGraphMetric(candidate.metrics.pitcherVulnerability)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-white/45">No pitcher vulnerability values are available.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default ProGraphsLabPageZ8;
