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

export function useHrBoardViewModel() {
  const [mode, setMode] = useState<HrWatchMode>('confirmed');
  const [viewMode, setViewMode] = useState<'cards' | 'spreadsheet'>('cards');
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<HrWatchRow | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const { data: rawBoard, loading, error, mutate: refresh } = useDailyHrBoard(today);

  const board = useMemo(() => rawBoard ? buildBoard(rawBoard as unknown) : null, [rawBoard]);
  const rows = useMemo(() => board ? rowsForMode(board, mode) : [], [board, mode]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    
    return rows.filter((row) => {
      const haystack = [
        row.playerName, row.team, row.opponent, row.pitcherName, 
        row.venue, row.reasons?.join(' '), row.oddsLabel
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, search]);

  const buckets = useMemo<HrBuckets>(() => {
    const b: HrBuckets = { Elite: [], Strong: [], Watch: [], Sleepers: [] };
    
    for (const row of filteredRows) {
      if (row.riskTier === 'Elite') b.Elite.push(row);
      else if (row.riskTier === 'Core') b.Strong.push(row);
      else if (row.riskTier === 'Watch') b.Watch.push(row);
      else b.Sleepers.push(row);
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
    buckets, stats, selectedPlayer, loading, error, mode, viewMode, search,
    setMode, setViewMode, setSearch, setSelectedPlayer, refresh,
  };
}
