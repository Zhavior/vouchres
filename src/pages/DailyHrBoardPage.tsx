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
    case 'bestOdds':
      return arr.sort((a, b) => {
        const cleanOdds = (value: unknown) => {
          const parsed = Number.parseInt(String(value ?? '').replace(/[^-+0-9]/g, ''), 10);
          return Number.isFinite(parsed) ? parsed : -9999;
        };

        return cleanOdds(b.bestOdds) - cleanOdds(a.bestOdds);
      });
    case 'lineupSpot':
      return arr.sort((a, b) => {
        const aSpot = typeof a.lineupSpot === 'number' ? a.lineupSpot : 99;
        const bSpot = typeof b.lineupSpot === 'number' ? b.lineupSpot : 99;
        return aSpot - bSpot;
      });
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

  const games = useMemo(() => {
    if (Array.isArray(board?.games) && board.games.length > 0) {
      return board.games;
    }

    const candidates = Array.isArray((board as any)?.candidates) ? (board as any).candidates : [];

    if (!candidates.length) return [];

    const grouped = new Map<string, any[]>();

    candidates.forEach((candidate: any, index: number) => {
      const team = candidate.teamAbbr ?? candidate.team ?? candidate.teamName ?? 'UNK';
      const opponent = candidate.opponentAbbr ?? candidate.opponent ?? candidate.vs ?? '';
      const gameKey = candidate.gamePk ?? candidate.gameId ?? `${team}${opponent ? ` vs ${opponent}` : ''}`;

      const row = {
        id: candidate.id ?? candidate.playerId ?? `${candidate.playerName ?? candidate.name ?? 'player'}-${index}`,
        playerId: candidate.playerId ?? candidate.id ?? index,
        playerName: candidate.playerName ?? candidate.name ?? candidate.fullName ?? 'Unknown Player',
        team,
        opponent,
        position: candidate.position ?? candidate.primaryPosition ?? '',
        grade: candidate.grade ?? candidate.tier ?? 'B',
        riskLabel: candidate.riskLabel ?? candidate.riskTier ?? candidate.risk ?? 'Standard',
        formTag: candidate.formTag ?? candidate.form ?? '',
        projectionType:
          candidate.projectionType ??
          (candidate.lineupStatus === 'confirmed'
            ? 'Confirmed'
            : candidate.lineupStatus === 'projected'
              ? 'Projected'
              : 'Projected'),
        lineupStatus: candidate.lineupStatus ?? 'projected',
        battingOrder: candidate.battingOrder ?? candidate.lineupSpot ?? null,
        hrEdge: Number(candidate.hrEdge ?? candidate.score ?? candidate.hrScore ?? candidate.vouchScore ?? 0),
        vouchScore: Number(candidate.vouchScore ?? candidate.hrScore ?? candidate.score ?? candidate.hrEdge ?? 0),
        pitcherVulnerability: Number(
          candidate.pitcherVulnerability ??
          candidate.pitcherVuln ??
          candidate.pitcherScore ??
          ((candidate.reasons ?? []).join(" ").match(/HR\/9 = ([\d.]+)/)?.[1] ?? 0)
        ),
        dataConfidence: Number(candidate.dataConfidence ?? candidate.confidence ?? 50),
        weatherBoost:
          candidate.weatherBoost !== undefined && candidate.weatherBoost !== null
            ? Number(candidate.weatherBoost)
            : candidate.parkWeatherBoost !== undefined && candidate.parkWeatherBoost !== null
              ? Number(candidate.parkWeatherBoost)
              : null,
        weatherSource: candidate.weatherSource ?? "unavailable",
        lineupSpot:
          candidate.battingOrder !== undefined && candidate.battingOrder !== null
            ? Number(candidate.battingOrder)
            : candidate.lineupSpot !== undefined && candidate.lineupSpot !== null
              ? Number(candidate.lineupSpot)
              : candidate.projectedLineupSpot !== undefined && candidate.projectedLineupSpot !== null
                ? Number(candidate.projectedLineupSpot)
                : null,
        bestOdds: String(candidate.bestOdds ?? candidate.odds ?? candidate.hrOdds ?? 'N/A'),
        pitcherName: candidate.pitcherName ?? candidate.opponentPitcher ?? candidate.opposingPitcher ?? candidate.probablePitcher ?? 'TBD',
        opponentPitcher: candidate.opponentPitcher ?? candidate.pitcherName ?? candidate.opposingPitcher ?? candidate.probablePitcher ?? 'TBD',
        oppPitcher: candidate.opponentPitcher ?? candidate.pitcherName ?? candidate.opposingPitcher ?? candidate.probablePitcher ?? 'TBD',
        opposingPitcher: candidate.opponentPitcher ?? candidate.pitcherName ?? candidate.opposingPitcher ?? candidate.probablePitcher ?? 'TBD',
        pitcherTeam: candidate.opponent ?? candidate.pitcherTeam ?? '',
        pTeam: candidate.opponent ?? candidate.pitcherTeam ?? '',
        opposingPitcherTeam: candidate.opponent ?? candidate.pitcherTeam ?? 'TBD',
        pitcherHand: candidate.pitcherHand ?? candidate.pitcherThrows ?? '',
        parkFactor: candidate.parkFactor ?? candidate.park ?? candidate.venue ?? 'N/A',
        hrMultiplier: candidate.hrMultiplier ?? candidate.hrMult ?? candidate.multiplier ?? 'N/A',
        gameStatus: candidate.status ?? candidate.gameStatus ?? candidate.lineupStatus ?? 'projected',
        lineMovement:
          candidate.lineMovement !== undefined && candidate.lineMovement !== null
            ? Number(candidate.lineMovement)
            : candidate.movePct !== undefined && candidate.movePct !== null
              ? Number(candidate.movePct)
              : candidate.movement !== undefined && candidate.movement !== null
                ? Number(candidate.movement)
                : null,
        bats: candidate.bats ?? candidate.batSide ?? '',
        reason: candidate.reason ?? candidate.summary ?? candidate.explanation ?? (Array.isArray(candidate.reasons) ? candidate.reasons.join(' • ') : ''),
        tags: Array.isArray(candidate.tags) ? candidate.tags : [candidate.riskTier, candidate.lineupStatus, candidate.injuryStatus].filter(Boolean),
        reasons: Array.isArray(candidate.reasons) ? candidate.reasons : [],
        warnings: Array.isArray(candidate.warnings) ? candidate.warnings : [],
        injuryStatus: candidate.injuryStatus ?? 'unknown',
        headshot: candidate.headshot ?? candidate.imageUrl ?? candidate.playerImage ?? (candidate.playerId ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_80,q_auto:best/v1/people/${candidate.playerId}/headshot/67/current` : ''),
        raw: candidate,
      } as any;

      if (!grouped.has(String(gameKey))) grouped.set(String(gameKey), []);
      grouped.get(String(gameKey))!.push(row);
    });

    return Array.from(grouped.entries()).map(([gameId, rows]) => {
      const firstRow = rows[0] ?? {};
      const team = firstRow.team ?? '';
      const opponent = firstRow.opponent ?? firstRow.pTeam ?? firstRow.pitcherTeam ?? '';
      const matchupLabel = team && opponent ? `${team} vs ${opponent}` : String(gameId);

      return {
        id: gameId,
        gameId,
        matchup: matchupLabel,
        label: matchupLabel,
        rows,
      };
    }) as any[];
  }, [board]);

  const teams = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => {
      const rows = Array.isArray(g.rows) ? g.rows : [];
      rows.forEach((r) => {
        if (r?.team) set.add(r.team);
      });
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [games]);

  const update = (next: Partial<HrBoardFilterState>) => setFilters((f) => ({ ...f, ...next }));

  const filteredGames = useMemo(() => {
    if (!board) return [];
    const isVercelSafePartial =
      (board as any)?.dataQuality === 'vercel_safe_partial' ||
      (board as any)?.runtime === 'vercel_standalone_no_server_imports';

    const q = filters.search.trim().toLowerCase();
    return games
      .map((g) => {
        const rows = (Array.isArray(g.rows) ? g.rows : []).filter((r) => {
          if (filters.team !== 'ALL' && r.team !== filters.team) return false;
          if (filters.grade !== 'ALL' && r.grade !== filters.grade) return false;
          if (filters.risk !== 'ALL' && r.riskLabel !== filters.risk) return false;
          if (!isVercelSafePartial && filters.hotOnly && r.formTag !== 'Hot') return false;
          if (!isVercelSafePartial && filters.sneakyOnly && r.riskLabel !== 'Sneaky') return false;
          if (!isVercelSafePartial && filters.confirmedOnly && r.projectionType !== 'Confirmed') return false;
          if (r.pitcherVulnerability < filters.minPitcherVuln) return false;
          if (q && !(r.playerName ?? '').toLowerCase().includes(q)) return false;
          return true;
        });
        return { ...g, rows: sortRows(rows, filters.sortKey) };
      })
      .filter((g) => g.rows.length > 0);
  }, [board, games, filters]);

  const totalRows = filteredGames.reduce((s, g) => s + g.rows.length, 0);

  const missingStarChecks = Array.isArray((board as any)?.debug?.missingStarChecks)
    ? (board as any).debug.missingStarChecks
    : [];

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

      {missingStarChecks.length > 0 && (
        <section className="mb-4 rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-4">
          <div className="mb-3">
            <h2 className="text-sm font-black text-white">Star Watch</h2>
            <p className="text-xs text-slate-400">
              Why major HR names are included, blocked, or excluded today.
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {missingStarChecks.map((star: any) => (
              <div key={star.playerName} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-white">{star.playerName}</div>
                    <div className="text-[11px] text-slate-500">{star.expectedTeam}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                    star.status === 'included'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : star.status === 'blocked'
                        ? 'bg-yellow-500/15 text-yellow-300'
                        : 'bg-red-500/15 text-red-300'
                  }`}>
                    {star.status === 'included' ? 'Included' : star.status === 'blocked' ? 'Waiting' : 'Excluded'}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-300">{star.reason}</div>
                {star.note && <div className="mt-1 text-[11px] text-slate-500">{star.note}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit mb-3 text-[11px] font-bold">
        {(['tier', 'game'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`px-3 py-1 rounded-lg transition-all ${view === v ? 'bg-orange-500/20 text-orange-300' : 'text-slate-400'}`}>
            {v === 'tier' ? 'By Tier' : 'By Game'}
          </button>
        ))}
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
        ) : view === 'tier' ? (
          <HrTierView games={filteredGames} onSelect={setSelected} onAddLeg={onAddLegToParlay} />
        ) : (
          filteredGames.map((g) => <HrBoardTable key={g.gamePk} game={g} onSelect={setSelected} />)
        )
      )}

      <HrPlayerDrawer row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
