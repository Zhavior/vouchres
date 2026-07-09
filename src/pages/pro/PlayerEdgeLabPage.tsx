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
    <main className="ve-page-shell min-h-screen px-3 py-4 text-[hsl(var(--ve-text-primary))] sm:px-4 lg:py-5">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[300px_1fr]">
        <section className="space-y-5 lg:col-span-2">
          <div className="ve-premium-panel overflow-hidden rounded-2xl p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="ve-chip ve-chip-premium px-2.5 py-1 text-[9px] uppercase tracking-[0.18em]">
                <Crown className="h-3.5 w-3.5" />
                Pro Player Edge
              </span>
              <span className="ve-chip ve-chip-primary px-2.5 py-1 text-[9px] uppercase tracking-[0.18em]">
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
              <div className="ve-stat-card rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
                  <ShieldCheck className="h-4 w-4 text-[hsl(var(--ve-success))]" />
                  Verified Feed
                </div>
                <div className="mt-2 text-xl font-black text-[hsl(var(--ve-text-primary))]">{rows.length}</div>
                <div className="text-xs text-[hsl(var(--ve-text-muted))]">Current player rows</div>
              </div>
              <div className="ve-stat-card rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
                  <TrendingUp className="h-4 w-4 text-[hsl(var(--ve-accent-cyan))]" />
                  Selected Edge
                </div>
                <div className="mt-2 truncate text-base font-black text-[hsl(var(--ve-text-primary))]">{selectedRow ? getPlayerName(selectedRow) : 'No player'}</div>
                <div className="text-xs text-[hsl(var(--ve-text-muted))]">Tap a player to research</div>
              </div>
              <div className="ve-stat-card rounded-xl border-[hsl(var(--ve-accent-gold)/0.30)] bg-[hsl(var(--ve-accent-gold)/0.08)] px-3 py-2.5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-accent-gold))]">
                  <Crown className="h-4 w-4" />
                  Premium Mode
                </div>
                <div className="mt-2 text-base font-black text-[hsl(var(--ve-text-primary))]">Headshots + Signals</div>
                <div className="text-xs text-[hsl(var(--ve-text-muted))]">Cleaner Pro scouting cards</div>
              </div>
            </div>
          </div>

          <VerifiedDataNotice
            variant={source === 'network' ? 'coming-soon' : 'feed-required'}
            title={loading ? 'Loading verified player feed' : source === 'network' ? 'Verified HR player feed' : 'Verified data feed required'}
            detail={error ? `${error}. No fake player data shown.` : 'Player panels use only the current production HR Board payload.'}
          />
        </section>

        <aside className="ve-premium-panel flex flex-col overflow-hidden rounded-2xl p-3 lg:sticky lg:top-5 lg:max-h-[calc(100vh-4rem)]">
          <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
                Player Queue
              </div>
              <div className="mt-1 text-[11px] text-[hsl(var(--ve-text-muted))]">New player signals with premium headshots</div>
            </div>
            <div className="rounded-full border border-[hsl(var(--ve-accent-gold)/0.30)] bg-[hsl(var(--ve-accent-gold)/0.10)] p-2 text-[hsl(var(--ve-accent-gold))]">
              <Crown className="h-4 w-4" />
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {loading ? <div className="ve-card-compact rounded-xl p-3 text-xs text-[hsl(var(--ve-text-muted))]">Loading verified HR board candidates...</div> : null}
            {!loading && !rows.length ? <div className="ve-card-compact rounded-xl p-3 text-xs text-[hsl(var(--ve-text-muted))]">No verified player rows available.</div> : null}
            {rows.slice(0, 30).map((row, index) => {
              const id = String(row.playerId ?? row.player_id ?? row.id ?? index);
              const active = String(selectedRow?.playerId ?? selectedRow?.player_id ?? selectedRow?.id) === id;
              return (
                <button
                  key={`${id}-${index}`}
                  type="button"
                  className={`group w-full overflow-hidden rounded-2xl border p-3 text-left transition ${
                    active
                      ? 'border-[hsl(var(--ve-accent-cyan)/0.46)] bg-[hsl(var(--ve-accent-cyan)/0.10)] shadow-lg shadow-[hsl(var(--ve-shadow)/0.18)]'
                      : 'border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.30)] hover:border-[hsl(var(--ve-accent-cyan)/0.30)] hover:bg-[hsl(var(--ve-surface-raised)/0.44)]'
                  }`}
                  onClick={() => setSelectedId(id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[hsl(var(--ve-border)/0.34)] bg-[hsl(var(--ve-bg-panel))]">
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
                      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,hsl(var(--ve-accent-cyan)/0.16),hsl(var(--ve-accent-gold)/0.08))]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-black text-[hsl(var(--ve-text-primary))]">
                        {getPlayerName(row)}
                      </div>
                      <div className="mt-1 text-xs text-[hsl(var(--ve-text-muted))]">
                        {safeText(row.team, 'MLB')} · {safeText(row.riskLabel ?? row.riskTier ?? row.risk, 'Review')}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {getSignalTags(row).map((tag) => (
                          <span
                            key={tag}
                            className="ve-chip px-2 py-0.5 text-[9px] uppercase tracking-wide"
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
            <PlayerIntelligenceCard payload={playerPayload} />
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
