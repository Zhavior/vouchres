import { useMemo, useState } from 'react';
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

export default function PlayerEdgeLabPage() {
  const { rows, loading, error, source } = useHrBoardProData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRow = rows.find((row) => String(row.playerId ?? row.player_id ?? row.id) === selectedId) || rows[0] || null;
  const playerPayload = useMemo(() => buildPlayerPayload(selectedRow), [selectedRow]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[320px_1fr]">
        <section className="space-y-5 lg:col-span-2">
          <ProPageHeader
            title="Player Edge Lab"
            subtitle="Deep player research for HR form, matchup context, hitter power, pitcher vulnerability, and Pro trend views."
            badge="Player Pro"
          />

          <VerifiedDataNotice
            variant={source === 'network' ? 'coming-soon' : 'feed-required'}
            title={loading ? 'Loading verified player feed' : source === 'network' ? 'Verified HR player feed' : 'Verified data feed required'}
            detail={error ? `${error}. No fake player data shown.` : 'Player panels use only the current production HR Board payload.'}
          />
        </section>

        <aside className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
          <div className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Player Queue
          </div>
          <div className="space-y-2">
            {loading ? <div className="rounded-xl border border-slate-800 p-3 text-xs text-slate-500">Loading verified HR board candidates...</div> : null}
            {!loading && !rows.length ? <div className="rounded-xl border border-slate-800 p-3 text-xs text-slate-500">No verified player rows available.</div> : null}
            {rows.slice(0, 30).map((row, index) => {
              const id = String(row.playerId ?? row.player_id ?? row.id ?? index);
              const active = String(selectedRow?.playerId ?? selectedRow?.player_id ?? selectedRow?.id) === id;
              return (
                <button
                  key={`${id}-${index}`}
                  type="button"
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    active ? 'border-sky-300/40 bg-sky-300/10' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                  onClick={() => setSelectedId(id)}
                >
                  <div className="text-sm font-black text-slate-100">
                    {safeText(row.playerName ?? row.player_name ?? row.player ?? row.name, 'Unknown player')}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {safeText(row.team, 'MLB')} · {safeText(row.riskLabel ?? row.riskTier ?? row.risk, 'Review')}
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
