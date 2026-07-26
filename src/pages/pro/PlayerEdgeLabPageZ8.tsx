import PlayerResearchDecisionCard from '@/components/player/PlayerResearchDecisionCard';
import { AuroraDisclosure } from '@/components/aurora/decision/AuroraDisclosure';
import { useMemo, useState } from 'react';
import {
  Activity,
  Brain,
  ChevronRight,
  Crown,
  Database,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Target,
  Zap,
} from 'lucide-react';

import {
  HrSignalGraphs,
  PlayerEdgeGraphs,
  VerifiedDataNotice,
  VerifiedGraphEmptyState,
} from '../../components/pro';
import { useEntitlements } from '../../features/hr/hooks/useEntitlements';
import {
  Z8_ACTIVE,
  Z8_IDLE,
  Z8_LABEL,
  Z8_PAGE,
  Z8_PAGE_PAD_X,
  Z8_PAGE_PAD_Y,
  Z8_PANEL,
  Z8_SECTION_HEADER,
  Z8_SURFACE,
} from '../../theme/z8Tokens';
import {
  buildPlayerPayload,
  safeNumber,
  safeText,
  useHrBoardProData,
} from './proLabData';
import { usePlayerEdgeResearch } from './usePlayerEdgeResearch';

const MAX_VISIBLE_PLAYERS = 30;

function getPlayerId(row: any): string | null {
  const value = row?.playerId ?? row?.player_id ?? row?.mlbId ?? row?.mlb_id;
  const parsed = safeNumber(value);
  return parsed !== null && parsed > 0 ? String(Math.trunc(parsed)) : null;
}

function getPlayerKey(row: any, index: number): string {
  return getPlayerId(row) ?? `${getPlayerName(row)}-${safeText(row?.team, 'unknown-team')}-${index}`;
}

function getPlayerName(row: any) {
  return safeText(row?.playerName ?? row?.player_name ?? row?.player ?? row?.name, 'Unknown player');
}

function getMlbHeadshotUrl(playerId?: string | number | null) {
  if (!playerId || playerId === 'undefined' || playerId === 'null') return '';
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${playerId}/headshot/67/current`;
}

function getPitcherId(row: any): number | null {
  const parsed = safeNumber(
    row?.opponentPitcherId ?? row?.opponent_pitcher_id ?? row?.pitcherId ?? row?.pitcher_id,
  );
  return parsed && parsed > 0 ? parsed : null;
}

function getGamePk(row: any): number | null {
  const parsed = safeNumber(row?.gamePk ?? row?.game_pk ?? row?.game_id);
  return parsed && parsed > 0 ? parsed : null;
}

function getScore(row: any) {
  const value = safeNumber(
    row?.hrEdge ?? row?.hr_edge ?? row?.hrScore ?? row?.hr_score,
  );
  return value === null ? null : Math.max(0, Math.min(100, Math.round(value)));
}

function getConfidence(row: any) {
  const value = safeNumber(row?.dataConfidence ?? row?.data_confidence);
  if (value === null) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getRiskLabel(row: any): string | null {
  const value = safeText(
    row?.riskLabel ?? row?.riskTier ?? row?.risk ?? row?.tier,
    '',
  ).trim();
  return value || null;
}

function formatResearchUpdatedAt(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleString();
}

function getLineupLabel(row: any): string {
  const value = safeText(row?.lineupStatus ?? row?.lineup_status, '').toLowerCase();
  if (value === 'confirmed') return 'Confirmed';
  if (value === 'projected' || value === 'projected_unconfirmed') return 'Projected, unconfirmed';
  return 'Unavailable';
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-l border-white/10 pl-4 first:border-l-0 first:pl-0">
      <div className={`flex items-center gap-2 ${Z8_LABEL} text-white/40`}>
        <Icon className="h-3.5 w-3.5 text-vouch-cyan" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-2 truncate text-xl font-black tracking-tight text-white">{value}</div>
      <div className="mt-0.5 text-[11px] text-white/45">{detail}</div>
    </div>
  );
}

export default function PlayerEdgeLabPageZ8() {
  const { rows, loading, error, source } = useHrBoardProData();
  const { isPro } = useEntitlements();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedRow =
    rows.find((row, index) => getPlayerKey(row, index) === selectedId) || rows[0] || null;
  const playerPayload = useMemo(() => buildPlayerPayload(selectedRow), [selectedRow]);
  const playerId = selectedRow ? getPlayerId(selectedRow) : null;
  const pitcherId = selectedRow ? getPitcherId(selectedRow) : null;
  const gamePk = selectedRow ? getGamePk(selectedRow) : null;
  const opponent = selectedRow ? safeText(selectedRow.opponent ?? selectedRow.opposingPitcherTeam, '') : '';
  const pitcherName = selectedRow
    ? safeText(selectedRow.opponentPitcherName ?? selectedRow.opposingPitcher ?? selectedRow.pitcherName, '')
    : '';
  const score = selectedRow ? getScore(selectedRow) : null;
  const confidence = selectedRow ? getConfidence(selectedRow) : null;

  const {
    data: research,
    loading: researchLoading,
    error: researchError,
    source: researchSource,
  } = usePlayerEdgeResearch(playerId, {
    pitcherId,
    opponent: opponent || null,
    gamePk,
  });
  const researchUpdatedAt = formatResearchUpdatedAt(research?.updatedAt);

  return (
    <main className={`${Z8_PAGE} ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y} overflow-x-hidden`}>
      <div className="mx-auto max-w-[1600px] space-y-4">
        <section className="relative overflow-hidden border border-white/10 bg-black/30">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(31,226,255,0.14),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(74,222,128,0.10),transparent_32%)]" />
          <div className="relative grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-7">
            <div className="flex min-w-0 flex-col justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 border border-vouch-cyan/25 bg-vouch-cyan/10 px-2.5 py-1 ${Z8_LABEL} text-vouch-cyan`}>
                    <Brain className="h-3.5 w-3.5" />
                    Aurora Research
                  </span>
                  <span className={`inline-flex items-center gap-1.5 border border-white/15 bg-white/5 px-2.5 py-1 ${Z8_LABEL} text-white/65`}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Source-aware evidence
                  </span>
                </div>

                <p className={`mt-5 ${Z8_LABEL} text-white/35`}>VOUCHEDGE PLAYER LAB</p>
                <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl">
                  Player research, presented with evidence
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
                  Aurora turns the current HR Board payload and available MLB research into a clear answer, its trust state, and the evidence behind it.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 sm:grid-cols-4">
                <Metric icon={Database} label="Player pool" value={String(rows.length)} detail="current board rows" />
                <Metric icon={Target} label="Edge score" value={score === null ? '—' : String(score)} detail="selected player" />
                <Metric icon={Activity} label="Data confidence" value={confidence === null ? '—' : `${confidence}%`} detail="payload completeness" />
                <Metric
                  icon={Radar}
                  label="Research feed"
                  value={researchLoading ? 'Loading' : researchSource === 'network' && research ? 'Available' : 'Unavailable'}
                  detail="MLB evidence layer"
                />
              </div>
            </div>

            <div className="relative min-h-[260px] overflow-hidden border border-white/10 bg-white/[0.025] p-5">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(31,226,255,0.08),transparent_48%,rgba(74,222,128,0.06))]" />
              {selectedRow ? (
                <div className="relative flex h-full flex-col justify-between gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className={`${Z8_LABEL} text-vouch-cyan`}>Current focus</div>
                      <div className="mt-2 text-2xl font-black tracking-tight text-white">{getPlayerName(selectedRow)}</div>
                      <div className="mt-1 text-sm text-white/50">
                        {safeText(selectedRow.team, 'MLB')} {opponent ? `vs ${opponent}` : ''}
                      </div>
                    </div>
                    {getRiskLabel(selectedRow) ? (
                      <span className="border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-black uppercase tracking-widest text-white/65">
                        {getRiskLabel(selectedRow)}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-1 items-end justify-between gap-5">
                    <div className="space-y-2 text-xs font-medium text-white/60">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 bg-vouch-cyan" />
                        Board source: {source === 'network' ? 'HR Board response' : 'unavailable'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 bg-vouch-cyan" />
                        Lineup: {getLineupLabel(selectedRow)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 bg-vouch-cyan" />
                        Pitcher: {pitcherName || 'unavailable'}
                      </div>
                    </div>
                    <div className="relative h-44 w-40 shrink-0 overflow-hidden">
                      <div className="absolute inset-x-4 bottom-0 h-24 bg-vouch-cyan/15 blur-3xl" />
                      {playerId ? (
                        <img
                          src={getMlbHeadshotUrl(playerId)}
                          alt=""
                          className="relative h-full w-full object-contain object-bottom drop-shadow-[0_18px_24px_rgba(0,0,0,0.6)]"
                          decoding="async"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="relative flex h-full items-center justify-center text-4xl font-black text-white/20" aria-hidden="true">
                          {getPlayerName(selectedRow).slice(0, 1)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-px bg-white/10">
                    <div className="bg-black/60 px-3 py-2.5">
                      <div className={`${Z8_LABEL} text-white/35`}>Score</div>
                      <div className="mt-1 text-lg font-black text-white">{score ?? '—'}</div>
                    </div>
                    <div className="bg-black/60 px-3 py-2.5">
                      <div className={`${Z8_LABEL} text-white/35`}>Data confidence</div>
                      <div className="mt-1 text-lg font-black text-white">{confidence === null ? '—' : `${confidence}%`}</div>
                    </div>
                    <div className="bg-black/60 px-3 py-2.5">
                      <div className={`${Z8_LABEL} text-white/35`}>Pitcher</div>
                      <div className="mt-1 truncate text-sm font-black text-white">{pitcherName || 'Pending'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative flex h-full flex-col items-center justify-center text-center">
                  <Brain className="h-10 w-10 text-white/20" />
                  <div className="mt-4 text-lg font-black text-white">Waiting for player data</div>
                  <div className="mt-2 max-w-xs text-sm text-white/45">
                    The Brain will not create substitute players or simulated evidence.
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>


        <VerifiedDataNotice
          variant={source === 'network' ? 'no-data' : 'feed-required'}
          title={loading ? 'Loading player feed' : source === 'network' ? 'HR player feed available' : 'Player data feed required'}
          detail={error ? `${error}. No substitute player data is shown.` : 'Every Aurora panel uses the current HR Board payload and available research response.'}
        />

        <section className={`${Z8_PANEL} overflow-hidden p-0`}>
          <div className={`flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5 ${Z8_SECTION_HEADER}`}>
              <div>
              <div className={`${Z8_LABEL} text-white/40`}>Player queue</div>
              <div className="mt-1 text-sm font-black text-white">Choose a player to review in Aurora</div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-white/40">
              <Zap className="h-4 w-4 text-vouch-cyan" />
              {Math.min(rows.length, MAX_VISIBLE_PLAYERS)} visible
            </div>
          </div>

          <div
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth overscroll-x-contain px-4 py-4 scroll-px-4 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-5 sm:scroll-px-5"
            role="group"
            aria-label="Select a player to research"
          >
            {loading ? (
              <div className={`${Z8_SURFACE} w-[84%] max-w-[300px] min-w-[280px] shrink-0 snap-center first:ml-1 last:mr-6 p-4 text-sm text-white/45`}>
                Loading current candidates…
              </div>
            ) : null}
            {!loading && !rows.length ? (
              <div className={`${Z8_SURFACE} w-[84%] max-w-[300px] min-w-[280px] shrink-0 snap-center first:ml-1 last:mr-6 p-4 text-sm text-white/45`}>
                No current player rows available.
              </div>
            ) : null}
            {rows.slice(0, MAX_VISIBLE_PLAYERS).map((row, index) => {
              const id = getPlayerId(row);
              const key = getPlayerKey(row, index);
              const selectedIndex = selectedRow ? rows.indexOf(selectedRow) : -1;
              const active = selectedRow ? getPlayerKey(selectedRow, selectedIndex) === key : false;
              const rowScore = getScore(row);
              const rowConfidence = getConfidence(row);
              const riskLabel = getRiskLabel(row);

              return (
                <button
                  key={key}
                  type="button"
                  className={`group w-[84%] max-w-[300px] min-w-[280px] shrink-0 snap-center first:ml-1 last:mr-6 scroll-ml-3 border p-3 text-left transition-[border-color,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vouch-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:w-[270px] sm:scroll-ml-5 ${
                    active
                      ? `${Z8_ACTIVE} border-vouch-cyan/70 bg-vouch-cyan/[0.09]`
                      : `${Z8_IDLE} hover:border-vouch-cyan/40`
                  }`}
                  onClick={() => setSelectedId(key)}
                  aria-label={`Research ${getPlayerName(row)}, ${rowScore ?? 'unknown'} edge score, ${
                    rowConfidence === null ? 'unknown confidence' : `${rowConfidence}% confidence`
                  }`}
                  aria-pressed={active}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                      {id ? (
                        <img
                          src={getMlbHeadshotUrl(id)}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl font-black text-white/20" aria-hidden="true">
                          {getPlayerName(row).slice(0, 1)}
                        </div>
                      )}
                      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-vouch-cyan/15 to-vouch-emerald/5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-white">{getPlayerName(row)}</div>
                          <div className="mt-1 truncate text-xs text-white/45">
                            {safeText(row.team, 'MLB')}{riskLabel ? ` · ${riskLabel}` : ''}
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${active ? 'text-vouch-cyan' : 'text-white/20 group-hover:translate-x-0.5 group-hover:text-white/50'}`} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="border-t border-white/10 pt-2">
                          <div className={`${Z8_LABEL} text-white/30`}>Edge</div>
                          <div className="mt-0.5 text-xl font-black tracking-tight text-white">{rowScore ?? '—'}</div>
                        </div>
                        <div className="border-t border-white/10 pt-2">
                          <div className={`${Z8_LABEL} text-white/30`}>Data confidence</div>
                          <div className="mt-0.5 text-xl font-black tracking-tight text-white">{rowConfidence === null ? '—' : `${rowConfidence}%`}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section aria-label="Aurora player decision">
          {playerPayload ? (
            <PlayerResearchDecisionCard
              payload={playerPayload}
              research={{
                source: research?.dataSource ?? null,
                updatedAt: research?.updatedAt ?? null,
                warnings: research?.warnings ?? [],
              }}
              deepResearchId="aurora-deep-research"
            />
          ) : (
            <VerifiedGraphEmptyState
              variant="feed-required"
              title="Player data required"
              detail="Aurora needs an HR Board player row before it can present a decision."
            />
          )}
        </section>

        {playerPayload ? (
          <AuroraDisclosure
            id="aurora-deep-research"
            title="Deep research"
            detail="Open matchup graphs, Statcast evidence, and the underlying research response."
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              <div className="min-w-0">
                {isPro ? (
                  <HrSignalGraphs payload={playerPayload} showLockedFutureGraphs={false} />
                ) : (
                  <div className={`${Z8_PANEL} border border-vouch-cyan/25 bg-vouch-cyan/[0.05] p-5`}>
                    <div className="flex items-start gap-3">
                      <div className="border border-vouch-cyan/25 bg-vouch-cyan/10 p-2 text-vouch-cyan">
                        <LockKeyhole className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-lg font-black text-white">Unlock the complete signal stack</div>
                        <p className="mt-2 text-sm leading-6 text-white/60">
                          Pro adds matchup graphs, pitcher vulnerability, Statcast quality, and deeper player evidence.
                        </p>
                        <button
                          type="button"
                          className="mt-4 inline-flex min-h-12 items-center gap-2 bg-vouch-cyan px-4 py-2.5 text-sm font-black text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                          onClick={() =>
                            window.dispatchEvent(
                              new CustomEvent('vouch:navigate', {
                                detail: { section: 'premium' },
                              }),
                            )
                          }
                        >
                          <Crown className="h-4 w-4" />
                          Upgrade to Pro
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`${Z8_PANEL} min-w-0 overflow-hidden p-0`}>
                <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                  <div className={`${Z8_LABEL} text-vouch-cyan`}>Research response</div>
                  <div className="mt-1 text-lg font-black text-white">{playerPayload.player.playerName}</div>
                  <div className="mt-2 text-xs leading-5 text-white/45">
                    {researchLoading
                      ? 'Loading the available MLB evidence.'
                      : research?.dataSource
                        ? `Source: ${research.dataSource}${researchUpdatedAt ? ` · Updated ${researchUpdatedAt}` : ''}`
                        : 'No research response is available for this player.'}
                  </div>
                </div>
                <div className="p-3 sm:p-5">
                  <PlayerEdgeGraphs
                    research={research}
                    loading={researchLoading}
                    error={researchError}
                    pitcherName={pitcherName || null}
                    opponent={opponent || null}
                  />
                </div>
              </div>
            </div>
          </AuroraDisclosure>
        ) : null}
      </div>
    </main>
  );
}
