import { useState, useMemo } from 'react';
import { useDailyHrBoard } from './useDailyHrBoard';
import { buildBoard, rowsForMode } from '../utils/normalizeHrWatch';
import type { HrWatchMode, HrWatchRow } from '../types/hrWatch';

export interface HrBoardStats {
  total: number;
  elite: number;
  strong: number;
  watch: number;
  sleepers: number;
}

export interface HrBuckets {
  Elite: HrWatchRow[];
  Strong: HrWatchRow[];
  Watch: HrWatchRow[];
  Sleepers: HrWatchRow[];
}

/** Engine risk tiers → board display columns. Blocked rows never render on the board. */
const DISPLAY_TIER: Record<HrWatchRow['riskTier'], keyof HrBuckets | null> = {
  Elite: 'Elite',
  Core: 'Strong',
  Watch: 'Watch',
  Deep: 'Sleepers',
  Blocked: null,
};

export function useHrBoardViewModel() {
  const [mode, setMode] = useState<HrWatchMode>('confirmed');
  const [viewMode, setViewMode] = useState<'cards' | 'spreadsheet'>('cards');
  const [search, setSearch] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<string[]>(['Elite', 'Strong', 'Watch', 'Sleepers']);
  const [selectedPlayer, setSelectedPlayer] = useState<HrWatchRow | null>(null);

  const onToggleTier = (tier: string) => {
    setSelectedTiers((current) =>
      current.includes(tier) ? current.filter((item) => item !== tier) : [...current, tier]
    );
  };

  const today = new Date().toISOString().slice(0, 10);
  const { data: rawBoard, loading, error, refresh } = useDailyHrBoard(today);

  const board = useMemo(() => rawBoard ? buildBoard(rawBoard as unknown) : null, [rawBoard]);
  const rows = useMemo(() => board ? rowsForMode(board, mode) : [], [board, mode]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const tier = DISPLAY_TIER[row.riskTier];
      if (!tier || !selectedTiers.includes(tier)) return false;
      if (!query) return true;
      const haystack = [
        row.playerName, row.team, row.opponent, row.pitcherName, 
        row.venue, row.reasons?.join(' '), row.oddsLabel
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, search, selectedTiers]);

  const buckets = useMemo<HrBuckets>(() => {
    const b: HrBuckets = { Elite: [], Strong: [], Watch: [], Sleepers: [] };
    
    for (const row of filteredRows) {
      const tier = DISPLAY_TIER[row.riskTier];
      if (tier) b[tier].push(row);
    }
    return b;
  }, [filteredRows]);

  const stats = useMemo<HrBoardStats>(() => ({
    total: filteredRows.length,
    elite: buckets.Elite.length,
    strong: buckets.Strong.length,
    watch: buckets.Watch.length,
    sleepers: buckets.Sleepers.length,
  }), [buckets, filteredRows.length]);

  return {
    buckets, rows: filteredRows, stats, selectedPlayer, loading, error, mode, viewMode, search, selectedTiers,
    setMode, setViewMode, setSearch, setSelectedPlayer, onToggleTier, refresh,
  };
}
