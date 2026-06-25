import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Flame, RefreshCw, AlertTriangle } from 'lucide-react';
import { vouchedgeApi } from '../api/vouchedgeApi';
import type { HrBoardResponse, HrBoardRow, HrBoardFilterState, SortKey } from '../types/hrBoard';
import HrBoardFilters from '../components/hr-board/HrBoardFilters';
import HrBoardTable from '../components/hr-board/HrBoardTable';
import HrTierView from '../components/hr-board/HrTierView';
import HrPlayerDrawer from '../components/hr-board/HrPlayerDrawer';
import type { MLBPlayer } from '../types';

const GRADE_RANK: Record<string, number> = { 'A+': 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
const REFRESH_MS = 5 * 60_000;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_FILTERS: HrBoardFilterState = {
  team: 'ALL', grade: 'ALL', risk: 'ALL', hotOnly: false, sneakyOnly: false,
  confirmedOnly: false, minPitcherVuln: 0, search: '', sortKey: 'hrEdge',
};

function sortRows(rows: HrBoardRow[], key: SortKey): HrBoardRow[] {
  const arr = [...rows];
  switch (key) {
    case 'grade': return arr.sort((a, b) => (GRADE_RANK[b.grade] ?? 0) - (GRADE_RANK[a.grade] ?? 0) || b.hrEdge - a.hrEdge);
    case 'bestOdds': return arr.sort((a, b) => parseInt(b.bestOdds, 10) - parseInt(a.bestOdds, 10));
    case 'lineupSpot': return arr.sort((a, b) => a.lineupSpot - b.lineupSpot);
    case 'vouchScore': return arr.sort((a, b) => b.vouchScore - a.vouchScore);
    case 'pitcherVulnerability': return arr.sort((a, b) => b.pitcherVulnerability - a.pitcherVulnerability);
    case 'dataConfidence': return arr.sort((a, b) => b.dataConfidence - a.dataConfidence);
    case 'weatherBoost': return arr.sort((a, b) => b.weatherBoost - a.weatherBoost);
    default: return arr.sort((a, b) => b.hrEdge - a.hrEdge);
  }
}

interface HrBoardPageProps {
  onAddLegToParlay?: (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => void;
}

export default function DailyHrBoardPage({ onAddLegToParlay }: HrBoardPageProps = {}) {
  const [view, setView] = useState<'tier' | 'game'>('tier');
  const [date, setDate] = useState(todayISO());
  const [board, setBoard] = useState<HrBoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HrBoardFilterState>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<HrBoardRow | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = date === todayISO() ? await vouchedgeApi.hrBoardToday() : await vouchedgeApi.hrBoardByDate(date);
      setBoard(data);
      setLastUpdated(new Date());
    } catch {
      setError('Backend unavailable — run the dev server (npm run dev) to load the live HR board.');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 5 min while viewing today's board.
  useEffect(() => {
    if (date !== todayISO()) return;
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [date, load]);

  const teams = useMemo(() => {
    const set = new Set<string>();
    board?.games.forEach((g) => g.rows.forEach((r) => set.add(r.team)));
    return ['ALL', ...Array.from(set).sort()];
  }, [board]);

  const update = (next: Partial<HrBoardFilterState>) => setFilters((f) => ({ ...f, ...next }));

  const filteredGames = useMemo(() => {
    if (!board) return [];
    const q = filters.search.trim().toLowerCase();
    return board.games
      .map((g) => {
        const rows = g.rows.filter((r) => {
          if (filters.team !== 'ALL' && r.team !== filters.team) return false;
          if (filters.grade !== 'ALL' && r.grade !== filters.grade) return false;
          if (filters.risk !== 'ALL' && r.riskLabel !== filters.risk) return false;
          if (filters.hotOnly && r.formTag !== 'Hot') return false;
          if (filters.sneakyOnly && r.riskLabel !== 'Sneaky') return false;
          if (filters.confirmedOnly && r.projectionType !== 'Confirmed') return false;
          if (r.pitcherVulnerability < filters.minPitcherVuln) return false;
          if (q && !r.playerName.toLowerCase().includes(q)) return false;
          return true;
        });
        return { ...g, rows: sortRows(rows, filters.sortKey) };
      })
      .filter((g) => g.rows.length > 0);
  }, [board, filters]);

  const totalRows = filteredGames.reduce((s, g) => s + g.rows.length, 0);

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-5 text-slate-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" /> Daily HR Edge Board
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {board ? `${board.date} · ${board.gameCount} games · ${totalRows} ranked hitters · data: ${board.dataQuality}` : 'Loading today’s slate…'}
            {lastUpdated && <span className="text-slate-600"> · updated {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Disclaimer */}
      <div className="mb-4 p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/15 flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-orange-400 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {board?.disclaimer ?? 'HR edge estimates are probability-based research for entertainment — not betting advice. Lineups, park, and weather are projected placeholders.'}
        </p>
      </div>

      <HrBoardFilters date={date} onDateChange={setDate} teams={teams} filters={filters} onChange={update} />

      {error && <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 text-center text-sm text-red-300">{error}</div>}

      {loading && !board && (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />)}</div>
      )}

      {board && !error && (
        filteredGames.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 font-mono rounded-2xl bg-slate-900/40 border border-slate-800">
            No hitters match these filters.
          </div>
        ) : (
          filteredGames.map((g) => <HrBoardTable key={g.gamePk} game={g} onSelect={setSelected} />)
        )
      )}

      <HrPlayerDrawer row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
