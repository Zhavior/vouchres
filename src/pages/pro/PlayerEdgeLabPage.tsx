import { useMemo, useState } from 'react';
import { Crown, Sparkles, ShieldCheck, TrendingUp } from 'lucide-react';
import {
  PlayerSignalPanel,
  ProLockedCard,
  ProPageHeader,
  VerifiedDataNotice,
  VerifiedGraphEmptyState,
} from '../../components/pro';
import {
  buildPlayerPayload,
  safeText,
  useHrBoardProData,
} from './proLabData';


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

export default function PlayerEdgeLabPage() {
  const { rows, loading, error, source } = useHrBoardProData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRow = rows.find((row) => String(row.playerId ?? row.player_id ?? row.id) === selectedId) || rows[0] || null;
  const playerPayload = useMemo(() => buildPlayerPayload(selectedRow), [selectedRow]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#020617_42%,#020617_100%)] px-4 py-6 text-slate-100">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[320px_1fr]">
        <section className="space-y-5 lg:col-span-2">
          <div className="overflow-hidden rounded-[2rem] border border-sky-300/20 bg-slate-950/70 p-5 shadow-2xl shadow-sky-950/30 backdrop-blur">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
                <Crown className="h-3.5 w-3.5" />
                Pro Player Edge
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-sky-200">
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
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Verified Feed
                </div>
                <div className="mt-2 text-2xl font-black text-white">{rows.length}</div>
                <div className="text-xs text-slate-500">Current player rows</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  <TrendingUp className="h-4 w-4 text-sky-300" />
                  Selected Edge
                </div>
                <div className="mt-2 truncate text-lg font-black text-white">{selectedRow ? getPlayerName(selectedRow) : 'No player'}</div>
                <div className="text-xs text-slate-500">Tap a player to research</div>
              </div>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-amber-200">
                  <Crown className="h-4 w-4" />
                  Premium Mode
                </div>
                <div className="mt-2 text-lg font-black text-white">Headshots + Signals</div>
                <div className="text-xs text-amber-100/70">Cleaner Pro scouting cards</div>
              </div>
            </div>
          </div>

          <VerifiedDataNotice
            variant={source === 'network' ? 'coming-soon' : 'feed-required'}
            title={loading ? 'Loading verified player feed' : source === 'network' ? 'Verified HR player feed' : 'Verified data feed required'}
            detail={error ? `${error}. No fake player data shown.` : 'Player panels use only the current production HR Board payload.'}
          />
        </section>

        <aside className="flex flex-col overflow-hidden rounded-[1.75rem] border border-sky-300/15 bg-slate-950/70 p-4 shadow-xl shadow-slate-950/50 backdrop-blur lg:sticky lg:top-6 lg:max-h-[calc(100vh-5rem)]">
          <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Player Queue
              </div>
              <div className="mt-1 text-[11px] text-slate-500">New player signals with premium headshots</div>
            </div>
            <div className="rounded-full border border-amber-300/30 bg-amber-300/10 p-2 text-amber-200">
              <Crown className="h-4 w-4" />
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {loading ? <div className="rounded-xl border border-slate-800 p-3 text-xs text-slate-500">Loading verified HR board candidates...</div> : null}
            {!loading && !rows.length ? <div className="rounded-xl border border-slate-800 p-3 text-xs text-slate-500">No verified player rows available.</div> : null}
            {rows.slice(0, 30).map((row, index) => {
              const id = String(row.playerId ?? row.player_id ?? row.id ?? index);
              const active = String(selectedRow?.playerId ?? selectedRow?.player_id ?? selectedRow?.id) === id;
              return (
                <button
                  key={`${id}-${index}`}
                  type="button"
                  className={`group w-full overflow-hidden rounded-2xl border p-3 text-left transition ${
                    active
                      ? 'border-sky-300/50 bg-sky-300/10 shadow-lg shadow-sky-950/30'
                      : 'border-slate-800 bg-slate-900/45 hover:border-sky-300/30 hover:bg-slate-900/75'
                  }`}
                  onClick={() => setSelectedId(id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
                      {getMlbHeadshotUrl(id) ? (
                        <img
                          src={getMlbHeadshotUrl(id)}
                          alt={getPlayerName(row)}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-400/20 to-amber-300/10" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black text-slate-100">
                        {getPlayerName(row)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {safeText(row.team, 'MLB')} · {safeText(row.riskLabel ?? row.riskTier ?? row.risk, 'Review')}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {getSignalTags(row).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300"
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
            <PlayerSignalPanel payload={playerPayload} />
          ) : (
            <VerifiedGraphEmptyState
              variant="feed-required"
              title="Verified data feed required"
              detail="The Player Edge Lab needs HR board player rows before rendering PlayerSignalPanel."
            />
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <ProLockedCard
              title="Batter vs Pitcher"
              description="Head-to-head history unlocks when verified matchup data is connected."
            />
            <ProLockedCard
              title="Vs Team Trends"
              description="Hits, RBIs, runs, HRs, and extra-base trends require a verified opponent history feed."
            />
            <ProLockedCard
              title="Hot / Cold Zone"
              description="Zone heatmaps require a verified zone feed. No hot-zone data is faked."
            />
          </div>
        </section>
      </div>
    </main>
  );
}
