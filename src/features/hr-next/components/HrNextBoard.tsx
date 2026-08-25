import { useState, useMemo } from 'react';
import type { HrNextItem } from '../hooks/useHrNextData';
import { HrNextCard } from './HrNextCard';
import { useMlbInjuries } from '../../../hooks/queries/useMlbInjuries';
import { HrNextRegisterRow } from './HrNextRegisterRow';
import type { GroupByMode } from '../hooks/useHrNextData';
import { partitionByTier, tierForScore, type HrNextTierColumn } from '../utils/tierPartition';

interface HrNextBoardProps {
  items: HrNextItem[];
  savedMap: Record<string, true>;
  onToggleSaved: (id: string) => void;
  onAddToSlip: (row: any) => void;
  isProMode?: boolean;
  groupBy?: GroupByMode;
  activeId?: string | null;
  onSelectActiveId?: (id: string) => void;
  selectedMatchupIndex?: number;
}

interface MatchupGroup {
  header: Extract<HrNextItem, { type: 'header' }>;
  awayTeam: string;
  homeTeam: string;
  away: Extract<HrNextItem, { type: 'row' }>[];
  home: Extract<HrNextItem, { type: 'row' }>[];
}

/**
 * Rows rendered per tier column before the expander appears.
 *
 * The HRPI bands are heavily bottom-weighted on a live slate — SLEEPER routinely
 * holds an order of magnitude more rows than ELITE. Without a cap the grid runs
 * to six figures of pixels with three of four columns blank for nearly all of
 * it. The remainder is never hidden: the count and a one-click expander are
 * always on screen.
 */
const ROWS_PER_COLUMN = 25;

export function HrNextBoard({
  items,
  savedMap,
  onToggleSaved,
  onAddToSlip,
  isProMode = false,
  groupBy,
  activeId: controlledActiveId,
  onSelectActiveId,
  selectedMatchupIndex = -1,
}: HrNextBoardProps) {
  /*
   * One lookup for every row on the board. Confirmed rows never match — a
   * candidate that cleared an official batting order cannot be on the IL — so
   * this only ever lights up the projected pool, which is the pool that would
   * otherwise rank a player who is not going to appear.
   */
  const { lookup: injuryFor } = useMlbInjuries();

  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const [openReceiptId, setOpenReceiptId] = useState<string | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<Record<string, true>>({});

  const activeId = controlledActiveId !== undefined ? controlledActiveId : internalActiveId;
  const setActiveId = onSelectActiveId || setInternalActiveId;

  const isMatchupMode = groupBy === 'matchup';
  const isTierMode = groupBy === 'tier';

  const matchups = useMemo(() => {
    if (!isMatchupMode) return [];

    const result: MatchupGroup[] = [];
    let currentMatchup: MatchupGroup | null = null;

    for (const item of items) {
      if (item.type === 'header') {
        if (currentMatchup) result.push(currentMatchup);
        currentMatchup = { header: item, awayTeam: '', homeTeam: '', away: [], home: [] };
      } else if (item.type === 'row' && currentMatchup) {
        if (currentMatchup.away.length === 0 && currentMatchup.home.length === 0) {
          currentMatchup.awayTeam = item.row.team;
          currentMatchup.away.push(item);
        } else if (item.row.team === currentMatchup.awayTeam) {
          currentMatchup.away.push(item);
        } else {
          if (!currentMatchup.homeTeam) currentMatchup.homeTeam = item.row.team;
          currentMatchup.home.push(item);
        }
      }
    }
    if (currentMatchup) result.push(currentMatchup);
    return result;
  }, [items, isMatchupMode]);

  const displayedMatchups = useMemo(() => {
    if (selectedMatchupIndex >= 0 && selectedMatchupIndex < matchups.length) {
      return [matchups[selectedMatchupIndex]];
    }
    return matchups;
  }, [matchups, selectedMatchupIndex]);

  // HRPI-band partition for the desktop 4-tier grid.
  const tierColumns: HrNextTierColumn[] = useMemo(
    () => (isTierMode ? partitionByTier(items) : []),
    [items, isTierMode],
  );

  const cardHandlers = {
    onSelect: (id: string) => setActiveId(id),
    onToggleSaved,
    onToggleReceipt: (id: string) => setOpenReceiptId((prev) => (prev === id ? null : id)),
    onAddToSlip,
  };

  const toggleTier = (key: string) =>
    setExpandedTiers((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });

  const renderTierRows = (column: HrNextTierColumn) =>
    (expandedTiers[column.tier.key] ? column.rows : column.rows.slice(0, ROWS_PER_COLUMN)).map(
      (item) => (
        <div key={item.id} id={`player-card-${item.row.stableId}`} className="w-full min-w-0">
          <HrNextCard
            row={item.row}
            injury={injuryFor(item.row.playerName, item.row.team)}
            compact={false}
            isProMode={isProMode}
            tier={column.tier}
            active={activeId === item.row.stableId}
            saved={Boolean(savedMap[item.row.stableId])}
            isReceiptOpen={openReceiptId === item.row.stableId}
            {...cardHandlers}
          />
        </div>
      ),
    );

  const renderExpander = (column: HrNextTierColumn) =>
    column.rows.length > ROWS_PER_COLUMN ? (
      <button
        type="button"
        onClick={() => toggleTier(column.tier.key)}
        aria-expanded={Boolean(expandedTiers[column.tier.key])}
        className={`mt-3 w-full rounded-none border ${column.tier.columnBorder} bg-[#060a0a] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-colors hover:bg-[#0a1010] ${column.tier.headerText}`}
      >
        {expandedTiers[column.tier.key]
          ? `Show top ${ROWS_PER_COLUMN}`
          : `Show all ${column.rows.length}`}
      </button>
    ) : null;

  if (isTierMode) {
    const totalRows = tierColumns.reduce((sum, col) => sum + col.rows.length, 0);

    // If every tier is empty, show one unified empty state — not 4 blank columns.
    if (totalRows === 0) {
      return (
        <div className="rounded-none border border-dashed border-white/10 bg-[#0a1010] px-6 py-12 text-center font-mono text-xs text-white/40">
          No rows matched the active filters.
        </div>
      );
    }

    // Pro Mode keeps its premium card grid: always all four tier columns so the
    // grid stays stable, cards rather than register lines. Standard mode is the
    // ranked register below. The two modes now render genuinely different row
    // components, so unlike the previous single-tree version this branch does
    // remount on toggle — the board's own state (expandedTiers, openReceiptId,
    // activeId) lives above it and survives.
    if (isProMode) {
      return (
        <div className="grid grid-cols-1 items-start gap-4 @xl:grid-cols-2 @5xl:grid-cols-4">
          {tierColumns.map((column) => (
            <section
              key={column.tier.key}
              aria-label={`${column.tier.label} tier`}
              className="min-w-0"
              style={{ contain: 'layout style' }}
            >
              <header
                className={`mb-3 flex items-center justify-between gap-2 rounded-none border ${column.tier.columnBorder} bg-[#060a0a] px-3 py-2`}
              >
                <h2
                  className={`flex min-w-0 items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] ${column.tier.headerText}`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${column.tier.headerDot}`} />
                  <span className="truncate">{column.tier.label}</span>
                </h2>
                <span className="shrink-0 font-mono text-[9px] font-bold tabular-nums text-white/40">
                  {column.rows.length} · {column.tier.rangeLabel}
                </span>
              </header>

              {column.rows.length > 0 ? (
                <div className="space-y-3">{renderTierRows(column)}</div>
              ) : (
                <div
                  className={`rounded-none border border-dashed ${column.tier.columnBorder} bg-[#060a0a]/50 px-3 py-6 text-center font-mono text-[10px] text-white/25`}
                >
                  No {column.tier.label.toLowerCase()} picks on today's slate
                </div>
              )}
              {renderExpander(column)}
            </section>
          ))}
        </div>
      );
    }

    const displayColumns = tierColumns.filter((column) => column.rows.length > 0);

    /*
     * The ranked opportunity register.
     *
     * Tier mode used to be a grid of cards — four columns in Pro Mode, a stack
     * otherwise. The page's dominant object is the ranked set, so it now reads
     * as one continuous register: tier bands are section headers, and every
     * candidate is a line carrying the same evidence sub-scores the Collision
     * Field plots. Rank is continuous across bands, so `01` is the slate leader
     * rather than the leader of its band.
     *
     * Selection, saved state, add-to-slip, tier grouping, the per-tier cap and
     * its expander all keep their existing handlers and ids — the row swaps its
     * presentation, not the board's behaviour.
     */
    let rank = 0;

    return (
      <div className="flex flex-col gap-8">
        {displayColumns.map((column) => {
          const visible = expandedTiers[column.tier.key]
            ? column.rows
            : column.rows.slice(0, ROWS_PER_COLUMN);

          return (
            <section key={column.tier.key} aria-label={`${column.tier.label} tier`} className="min-w-0">
              <header className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
                <h2 className={`flex min-w-0 items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${column.tier.headerText}`}>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${column.tier.headerDot}`} />
                  <span className="truncate">{column.tier.label}</span>
                </h2>
                <span className="shrink-0 font-mono text-[9px] tabular-nums uppercase tracking-[0.16em] text-white/30">
                  {column.rows.length} · {column.tier.rangeLabel}
                </span>
              </header>

              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th scope="col" className="w-10 py-2 pl-3 pr-2 text-left font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-white/30">#</th>
                    <th scope="col" className="py-2 pr-3 text-left font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-white/30">Player</th>
                    <th scope="col" className="hidden py-2 pr-3 text-left font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-white/30 sm:table-cell">Matchup</th>
                    <th scope="col" className="w-16 py-2 pr-3 text-right font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-white/30">HRPI</th>
                    <th scope="col" className="hidden w-16 py-2 pr-3 text-right font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-white/30 md:table-cell">Power</th>
                    <th scope="col" className="hidden w-16 py-2 pr-3 text-right font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-white/30 md:table-cell">Vuln</th>
                    <th scope="col" className="hidden w-16 py-2 pr-3 text-right font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-white/30 lg:table-cell">Park</th>
                    <th scope="col" className="w-28 py-2 pr-3 text-right font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-white/30">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => {
                    rank += 1;
                    return (
                      <HrNextRegisterRow
                        key={item.id}
                        row={item.row}
                        rank={rank}
                        tier={column.tier}
                        active={activeId === item.row.stableId}
                        saved={Boolean(savedMap[item.row.stableId])}
                        onSelect={setActiveId}
                        onToggleSaved={onToggleSaved}
                        onAddToSlip={onAddToSlip}
                      />
                    );
                  })}
                </tbody>
              </table>

              {renderExpander(column)}
            </section>
          );
        })}
      </div>
    );
  }

  // ─── MATCHUP MODE (away / home split per game) ────────────────────────────
  if (isMatchupMode) {
    return (
      <>
        {displayedMatchups.map((matchup) => (
          <div key={matchup.header.id} className="mb-6 rounded-none border border-white/10 bg-[#0a1010] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-white">
                {matchup.awayTeam || 'AWAY'} <span className="text-white/40">@</span> {matchup.homeTeam || 'HOME'}
              </h2>
              <span className="font-mono text-[10px] text-white/50">
                {matchup.away.length + matchup.home.length} ANALYZED
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {([
                { key: 'away', label: `Away (${matchup.awayTeam})`, rows: matchup.away },
                { key: 'home', label: `Home (${matchup.homeTeam})`, rows: matchup.home },
              ] as const).map((side) => (
                <div key={side.key} className="space-y-3">
                  <h3 className="mb-2 font-mono text-[10px] font-bold uppercase text-white/40">{side.label}</h3>
                  {side.rows.map((item) => (
                    <div key={item.id} id={`player-card-${item.row.stableId}`}>
                      <HrNextCard
                        row={item.row}
                        injury={injuryFor(item.row.playerName, item.row.team)}
                        compact
                        isProMode={false}
                        tier={tierForScore(item.row.hrScore)}
                        active={activeId === item.row.stableId}
                        saved={Boolean(savedMap[item.row.stableId])}
                        isReceiptOpen={openReceiptId === item.row.stableId}
                        {...cardHandlers}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </>
    );
  }

  // ─── FLAT SORT ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => {
        if (item.type === 'header') return null;
        return (
          <div key={item.id} id={`player-card-${item.row.stableId}`} className="w-full min-w-0">
            <HrNextCard
              row={item.row}
              injury={injuryFor(item.row.playerName, item.row.team)}
              compact={false}
              isProMode={false}
              tier={tierForScore(item.row.hrScore)}
              active={activeId === item.row.stableId}
              saved={Boolean(savedMap[item.row.stableId])}
              isReceiptOpen={openReceiptId === item.row.stableId}
              {...cardHandlers}
            />
          </div>
        );
      })}
    </div>
  );
}
