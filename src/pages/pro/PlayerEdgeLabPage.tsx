import PlayerIntelligenceCard from "@/components/player/PlayerIntelligenceCard";
import { useMemo, useState } from 'react';
import { Crown, Sparkles, ShieldCheck, TrendingUp } from 'lucide-react';

import {
  HrSignalGraphs,
  PlayerEdgeGraphs,
  ProPageHeader,
  VerifiedDataNotice,
  VerifiedGraphEmptyState,
} from '../../components/pro';

import {
  buildPlayerPayload,
  safeNumber,
  safeText,
  useHrBoardProData,
} from './proLabData';
import { useEntitlements } from "../../features/hr/hooks/useEntitlements";
import { usePlayerEdgeResearch } from './usePlayerEdgeResearch';
import { Z8_ACTIVE, Z8_IDLE, Z8_LABEL, Z8_PAGE, Z8_PANEL, Z8_SURFACE } from '../../theme/z8Tokens';


function getPlayerId(row: any, fallback: number) {
  return String(row?.playerId ?? row?.player_id ?? row?.mlbId ?? row?.mlb_id ?? row?.id ?? fallback);
}

function getPlayerName(row: any) {
  return safeText(row?.playerName ?? row?.player_name ?? row?.player ?? row?.name, 'Unknown player');
}

function getMlbHeadshotUrl(playerId?: string | number | null) {
  if (!playerId || playerId === 'undefined' || playerId === 'null') return '';
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/${playerId}/headshot/67/current`;
}

function getSignalTags(row: any) {
  const risk = String(row?.riskLabel ?? row?.riskTier ?? row?.risk ?? '').toLowerCase();
  const tags = ['AI Watch'];

  if (risk.includes('hot') || risk.includes('high') || risk.includes('green')) tags.push('Hot Bat');
  if (risk.includes('hr') || risk.includes('power')) tags.push('HR Watch');
  if (risk.includes('value') || risk.includes('sneaky')) tags.push('Value Slip');

  return tags.slice(0, 3);
}

function getPitcherId(row: any): number | null {
  const raw = row?.opponentPitcherId ?? row?.opponent_pitcher_id ?? row?.pitcherId ?? row?.pitcher_id;
  const parsed = safeNumber(raw);
  return parsed && parsed > 0 ? parsed : null;
}

function getGamePk(row: any): number | null {
  const raw = row?.gamePk ?? row?.game_pk ?? row?.game_id;
  const parsed = safeNumber(raw);
  return parsed && parsed > 0 ? parsed : null;
}

export default function PlayerEdgeLabPage() {
  const { rows, loading, error, source } = useHrBoardProData();
  const { isPro } = useEntitlements();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRow = rows.find((row) => String(row.playerId ?? row.player_id ?? row.id) === selectedId) || rows[0] || null;
  const playerPayload = useMemo(() => buildPlayerPayload(selectedRow), [selectedRow]);
  const playerId = selectedRow ? getPlayerId(selectedRow, 0) : null;
  const pitcherId = selectedRow ? getPitcherId(selectedRow) : null;
  const gamePk = selectedRow ? getGamePk(selectedRow) : null;
  const opponent = selectedRow ? safeText(selectedRow.opponent ?? selectedRow.opposingPitcherTeam, '') : '';
  const pitcherName = selectedRow
    ? safeText(selectedRow.opponentPitcherName ?? selectedRow.opposingPitcher ?? selectedRow.pitcherName, '')
    : '';

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

  return (
    <main className={`${Z8_PAGE} px-3 py-4 sm:px-4 lg:py-5`}>
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[300px_1fr]">
        <section className="space-y-5 lg:col-span-2">
          <div className={`${Z8_PANEL} overflow-hidden rounded-2xl p-4`}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 border border-vouch-emerald/25 bg-vouch-emerald/10 px-2.5 py-1 ${Z8_LABEL} text-vouch-emerald`}>
                <Crown className="h-3.5 w-3.5" />
                Pro Player Edge
              </span>
              <span className={`inline-flex items-center gap-1.5 border border-vouch-cyan/25 bg-vouch-cyan/10 px-2.5 py-1 ${Z8_LABEL} text-vouch-cyan`}>
                <Sparkles className="h-3.5 w-3.5" />
                AI Edge Lab
              </span>
            </div>

            <ProPageHeader
              title="Player Edge Lab"
              subtitle="Premium player research for HR form, matchup context, hitter power, pitcher vulnerability, hot bats, and value slip signals."
              badge="Player Pro"
            />

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className={`${Z8_PANEL} rounded-xl px-3 py-2.5`}>
                <div className={`flex items-center gap-2 ${Z8_LABEL} text-white/40`}>
                  <ShieldCheck className="h-4 w-4 text-vouch-emerald" />
                  Verified Feed
                </div>
                <div className="mt-2 text-xl font-black text-white">{rows.length}</div>
                <div className="text-xs text-white/45">Current player rows</div>
              </div>
              <div className={`${Z8_PANEL} rounded-xl px-3 py-2.5`}>
                <div className={`flex items-center gap-2 ${Z8_LABEL} text-white/40`}>
                  <TrendingUp className="h-4 w-4 text-vouch-cyan" />
                  Selected Edge
                </div>
                <div className="mt-2 truncate text-base font-black text-white">{selectedRow ? getPlayerName(selectedRow) : 'No player'}</div>
                <div className="text-xs text-white/45">Tap a player to research</div>
              </div>
              <div className={`${Z8_PANEL} rounded-xl border-vouch-emerald/30 bg-vouch-emerald/8 px-3 py-2.5`}>
                <div className={`flex items-center gap-2 ${Z8_LABEL} text-vouch-emerald`}>
                  <Crown className="h-4 w-4" />
                  MLB Graphs
                </div>
                <div className="mt-2 text-base font-black text-white">
                  {researchSource === 'network' && research ? 'Live API' : 'Select player'}
                </div>
                <div className="text-xs text-white/45">BvP, trends, Statcast quality</div>
              </div>
            </div>
          </div>

          <VerifiedDataNotice
            variant={source === 'network' ? 'no-data' : 'feed-required'}
            title={loading ? 'Loading verified player feed' : source === 'network' ? 'Verified HR player feed' : 'Verified data feed required'}
            detail={error ? `${error}. No fake player data shown.` : 'Player panels use only the current production HR Board payload.'}
          />
        </section>

        <aside className={`${Z8_PANEL} flex flex-col overflow-hidden rounded-2xl p-3 lg:sticky lg:top-5 lg:max-h-[calc(100vh-4rem)]`}>
          <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
            <div>
              <div className={`${Z8_LABEL} text-white/40`}>
                Player Queue
              </div>
              <div className="mt-1 text-[11px] text-white/45">New player signals with premium headshots</div>
            </div>
            <div className="rounded-full border border-vouch-emerald/30 bg-vouch-emerald/10 p-2 text-vouch-emerald">
              <Crown className="h-4 w-4" />
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {loading ? <div className={`${Z8_SURFACE} rounded-xl p-3 text-xs text-white/45`}>Loading verified HR board candidates...</div> : null}
            {!loading && !rows.length ? <div className={`${Z8_SURFACE} rounded-xl p-3 text-xs text-white/45`}>No verified player rows available.</div> : null}
            {rows.slice(0, 30).map((row, index) => {
              const id = String(row.playerId ?? row.player_id ?? row.id ?? index);
              const active = String(selectedRow?.playerId ?? selectedRow?.player_id ?? selectedRow?.id) === id;
              return (
                <button
                  key={`${id}-${index}`}
                  type="button"
                  className={`group w-full overflow-hidden rounded-2xl border p-3 text-left transition ${
                    active ? Z8_ACTIVE : Z8_IDLE
                  }`}
                  onClick={() => setSelectedId(id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30`}>
                      {getMlbHeadshotUrl(id) ? (
                        <img
                          src={getMlbHeadshotUrl(id)}
                          alt={getPlayerName(row)}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-vouch-cyan/16 to-vouch-emerald/8" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black text-white">
                        {getPlayerName(row)}
                      </div>
                      <div className="mt-1 text-xs text-white/45">
                        {safeText(row.team, 'MLB')} · {safeText(row.riskLabel ?? row.riskTier ?? row.risk, 'Review')}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {getSignalTags(row).map((tag) => (
                          <span
                            key={tag}
                            className={`border border-vouch-cyan/20 bg-vouch-cyan/10 px-2 py-0.5 ${Z8_LABEL} text-vouch-cyan`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-4">
          {playerPayload ? (
            <>
              <PlayerIntelligenceCard payload={playerPayload} />

              {isPro ? (
                <HrSignalGraphs
                  payload={playerPayload}
                  showLockedFutureGraphs={false}
                />
              ) : (
                <div className={`${Z8_PANEL} rounded-2xl border border-vouch-cyan/30 bg-vouch-cyan/10 p-5`}>
                  <div className="text-lg font-black text-white">
                    🔒 Pro Player Edge Intelligence
                  </div>

                  <p className="mt-2 text-sm text-white/70">
                    Unlock matchup graphs, pitcher vulnerability,
                    Statcast quality, and deeper AI research.
                  </p>

                  <button
                    type="button"
                    className="mt-4 rounded-xl bg-vouch-cyan px-5 py-2 text-sm font-black text-black"
                    onClick={() => window.dispatchEvent(new CustomEvent("vouch:navigate", {
                      detail: { section: "premium" }
                    }))}
                  >
                    Upgrade to Pro
                  </button>
                </div>
              )}
            </>
          ) : (
            <VerifiedGraphEmptyState
              variant="feed-required"
              title="Verified data feed required"
              detail="The Player Edge Lab needs HR board player rows before rendering signal graphs."
            />
          )}

          {research?.warnings?.length ? (
            <div className={`${Z8_SURFACE} rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-100/90`}>
              {research.warnings.slice(0, 4).map((warning) => (
                <div key={warning}>{warning}</div>
              ))}
            </div>
          ) : null}

          <div className={`${Z8_PANEL} rounded-2xl p-4`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className={`${Z8_LABEL} text-white/40`}>MLB Research Graphs</div>
                <div className="mt-1 text-sm font-black text-white">BvP, spray, pitch mix, trends</div>
              </div>
              <span className={`inline-flex items-center gap-1.5 border border-vouch-emerald/25 bg-vouch-emerald/10 px-2.5 py-1 ${Z8_LABEL} text-vouch-emerald`}>
                {researchSource === 'network' && research ? 'Live MLB API' : researchLoading ? 'Loading…' : 'Select player'}
              </span>
            </div>

            <PlayerEdgeGraphs
              research={research}
              loading={researchLoading}
              error={researchError}
              pitcherName={pitcherName || null}
              opponent={opponent || null}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
