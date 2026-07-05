import React, { useMemo, useState } from 'react';
import { useDailyHrBoard } from '../features/hr/hooks/useDailyHrBoard';
import { buildBoard, groupRowsByGame, groupRowsByTier, rowsForMode } from '../features/hr/utils/normalizeHrWatch';
import { HrWatchTierSection } from '../features/hr/components/HrWatchTierSection';
import type { CreatorProofProfile, MLBPlayer } from '../types';
import type { HrWatchBoard, HrWatchMode, HrWatchRow } from '../features/hr/types/hrWatch';

interface DailyHrWatchNewPageProps {
  profile?: CreatorProofProfile | null;
  onAddLegToParlay?: (
    player: MLBPlayer,
    prop: {
      id: string;
      market: string;
      odds: number | null;
      spec: string;
      gamePk?: string | number;
      playerId?: string | number;
    },
  ) => void;
}

function toMlbPlayerForParlay(row: HrWatchRow): MLBPlayer {
  return {
    id: String(row.playerId ?? row.stableId),
    name: row.playerName,
    team: row.team,
    headshot: row.headshotUrl ?? undefined,
  } as unknown as MLBPlayer;
}

function buildHrProp(row: HrWatchRow, target: 1 | 2) {
  const market = 'Player Home Runs';
  const label = target === 1 ? '1+ HR' : '2+ HR';

  return {
    id: `mlb-hr-${target}-${row.gamePk ?? 'game-tbd'}-${row.playerId ?? row.stableId}`,
    market,
    odds: null,
    spec: `${row.playerName} ${label}`,
    gamePk: row.gamePk ?? undefined,
    playerId: row.playerId ?? undefined,
  };
}



export default function DailyHrWatchNewPage({ profile, onAddLegToParlay }: DailyHrWatchNewPageProps) {
  const [mode, setMode] = useState<HrWatchMode>('confirmed');
  const [search, setSearch] = useState('');
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({
    'Vouch Elite': 18,
    'Core Targets': 18,
    'Watch List': 18,
    'Deep Research': 18,
  });

  const isProAccount = profile != null;
  const today = new Date().toISOString().slice(0, 10);
  const { data: rawBoard, loading, error } = useDailyHrBoard(today);

  const board = useMemo<HrWatchBoard | null>(() => {
    if (!rawBoard) return null;
    return buildBoard(rawBoard as unknown);
  }, [rawBoard]);

  const allRows = useMemo<readonly HrWatchRow[]>(() => {
    if (!board) return [];
    return rowsForMode(board, mode);
  }, [board, mode]);

  const activeRows = useMemo<readonly HrWatchRow[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;

    return allRows.filter((row) => {
      const haystack = [
        row.playerName,
        row.team,
        row.opponent,
        row.pitcherName,
        row.venue,
        row.truthStatus,
        row.riskTier,
        row.oddsLabel,
        ...row.reasons,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [allRows, search]);

  const handleLoadMore = (tierKey: string): void => {
    setVisibleCounts((previous) => ({
      ...previous,
      [tierKey]: (previous[tierKey] ?? 18) + 18,
    }));
  };

  const handleAddHrLeg = (row: HrWatchRow, target: 1 | 2): void => {
    if (!onAddLegToParlay) return;
    onAddLegToParlay(toMlbPlayerForParlay(row), buildHrProp(row, target));
  };

  return (
    <main className="min-h-screen bg-[hsl(var(--ve-bg))] text-[hsl(var(--ve-text-primary))]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 pb-10 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-[hsl(var(--ve-border)/0.22)] bg-[linear-gradient(145deg,hsl(var(--ve-surface)/0.96),hsl(var(--ve-surface-raised)/0.56))] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[hsl(var(--ve-text-muted))]">
                Verified MLB HR Board
              </p>
              <h1 className="text-2xl font-black tracking-tight text-[hsl(var(--ve-text-primary))]">
                HR board
              </h1>
              <p className="max-w-2xl text-sm text-[hsl(var(--ve-text-muted))]">
                {board?.truthMessage ??
                  'Confirmed rows use official batting orders only. Preview rows stay clearly marked until lineups post.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-right">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-100/70">
                  Confirmed
                </div>
                <div className="font-mono text-2xl font-black text-emerald-200">
                  {board?.counts.confirmedCandidates ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-2">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-100/70">
                  Preview
                </div>
                <div className="font-mono text-2xl font-black text-amber-200">
                  {board?.counts.projectedCandidates ?? 0}
                </div>
              </div>
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-3 py-2">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-rose-100/70">
                  Blocked
                </div>
                <div className="font-mono text-2xl font-black text-rose-200">
                  {board?.counts.blockedPlayers ?? 0}
                </div>
              </div>
            </div>
          </div>

          {mode === 'curated' || mode === 'all' ? (
            <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-100">
              Official lineup not posted yet. Projection preview rows are safe roster previews only and are never treated as confirmed candidates.
            </div>
          ) : null}

          {board?.counts.hiddenProjectedCandidates ? (
            <div className="mt-3 text-xs font-semibold text-[hsl(var(--ve-text-muted))]">
              {board.counts.hiddenProjectedCandidates} additional projected rows are hidden by the backend preview limit.
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-2 rounded-2xl border border-[hsl(var(--ve-border)/0.22)] bg-black/10 px-3 py-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
                Search
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Player, team, pitcher, venue..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-[hsl(var(--ve-text-muted))]"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {(['confirmed', 'curated', 'all', 'blocked'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition ${
                    mode === item
                      ? 'border-[hsl(var(--ve-accent-cyan)/0.44)] bg-[hsl(var(--ve-accent-cyan)/0.12)] text-cyan-100'
                      : 'border-[hsl(var(--ve-border)/0.22)] bg-black/10 text-[hsl(var(--ve-text-muted))]'
                  }`}
                >
                  {item === 'confirmed'
                    ? `Confirmed ${board?.confirmed.length ?? 0}`
                    : item === 'curated'
                      ? `Preview ${board?.curated.length ?? 0}`
                      : item === 'all'
                        ? `All Projected ${board?.all.length ?? 0}`
                        : `Blocked ${board?.blocked.length ?? 0}`}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-[hsl(var(--ve-border)/0.22)] bg-[linear-gradient(145deg,hsl(var(--ve-surface)/0.92),hsl(var(--ve-surface-raised)/0.48))] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[hsl(var(--ve-text-muted))]">
                Pro modules
              </p>
              <h2 className="text-lg font-black">
                {isProAccount ? 'Unlocked' : 'Locked'}
              </h2>
            </div>
            <div className="rounded-full border border-[hsl(var(--ve-border)/0.24)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
              {isProAccount ? 'Pro access' : 'Upgrade required'}
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {[
              'Advanced Swing Path',
              'Pitcher Mistake Zones',
              'Park / Weather Boost',
              'Recent Barrel Trend',
            ].map((module) => (
              <div
                key={module}
                className={`rounded-2xl border px-3 py-3 text-sm ${
                  isProAccount
                    ? 'border-[hsl(var(--ve-accent-cyan)/0.22)] bg-[hsl(var(--ve-accent-cyan)/0.08)]'
                    : 'border-[hsl(var(--ve-border)/0.22)] bg-black/10 opacity-80'
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
                  {isProAccount ? 'Unlocked' : 'Locked'}
                </div>
                <div className="mt-1 font-semibold">{module}</div>
              </div>
            ))}
          </div>
        </section>

        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-2xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface-raised)/0.42)]"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface)/0.42)] p-8 text-center">
            <h2 className="text-lg font-black text-[hsl(var(--ve-text-primary))]">Screen failed safely</h2>
            <p className="mt-1 text-sm text-[hsl(var(--ve-text-muted))]">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && activeRows.length === 0 && (
          <div className="rounded-3xl border border-[hsl(var(--ve-border)/0.28)] bg-[hsl(var(--ve-surface)/0.42)] p-8 text-center">
            <h2 className="text-lg font-black text-[hsl(var(--ve-text-primary))]">No HR rows in this view yet</h2>
            <p className="mt-1 text-sm text-[hsl(var(--ve-text-muted))]">
              Try All Projected, clear search, or wait for lineup confirmation.
            </p>
          </div>
        )}

        {!loading && !error && activeRows.length > 0 && (
          <div className="space-y-5">
            {groupRowsByGame(activeRows).map((game) => {
              const gameTierGroups = groupRowsByTier(game.rows);

              return (
                <section
                  key={game.key}
                  className="space-y-4 rounded-3xl border border-[hsl(var(--ve-border)/0.22)] bg-[linear-gradient(145deg,hsl(var(--ve-surface)/0.88),hsl(var(--ve-surface-raised)/0.40))] p-4"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-[hsl(var(--ve-border)/0.14)] pb-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[hsl(var(--ve-text-muted))]">
                        Game
                      </p>
                      <h2 className="truncate text-lg font-black text-[hsl(var(--ve-text-primary))]">
                        {game.title}
                      </h2>
                      <p className="mt-1 text-xs text-[hsl(var(--ve-text-muted))]">
                        {game.subtitle}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-2xl border border-[hsl(var(--ve-border)/0.24)] bg-black/10 px-3 py-2 text-right">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(var(--ve-text-muted))]">
                        Rows
                      </div>
                      <div className="font-mono text-2xl font-black text-[hsl(var(--ve-accent-gold))]">
                        {game.rows.length}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {gameTierGroups.map((tier) => (
                      <HrWatchTierSection
                        key={`${game.key}-${tier.key}`}
                        title={tier.title}
                        subtitle={tier.subtitle}
                        rows={tier.rows}
                        visibleCount={visibleCounts[`${game.key}:${tier.key}`] ?? 18}
                        onLoadMore={() => handleLoadMore(`${game.key}:${tier.key}`)}
                        onAddHrLeg={handleAddHrLeg}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
