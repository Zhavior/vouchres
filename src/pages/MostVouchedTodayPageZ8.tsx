import React, { useMemo, useState } from 'react';
import { Heart, Flame, Search, Calendar, ChevronDown, RefreshCw, Trophy, Filter, ArrowLeft } from 'lucide-react';
import { usePlayerVouchLeaderboard, useTogglePlayerVouch, PlayerVouchSummary } from '../hooks/queries/usePlayerVouchLayer';
import { useDailyHrBoard } from '../features/hr/hooks/useDailyHrBoard';
import { MostVouchedPodium } from '../features/hr/components/Social/MostVouchedPodium';
import { MostVouchedCard } from '../features/hr/components/Social/MostVouchedCard';
import HrPlayerDrawer from '../features/hr/components/Drawer/HrPlayerDrawer';
import { localISODate } from '../features/hr/utils/localDate';
import type { HrWatchRow } from '../features/hr/types/hrWatch';

interface MostVouchedTodayPageZ8Props {
  onNavigate?: (section: string) => void;
  onAddPlayerToSlip?: (player: any) => void;
}

export function MostVouchedTodayPageZ8({ onNavigate, onAddPlayerToSlip }: MostVouchedTodayPageZ8Props) {
  const [selectedDate, setSelectedDate] = useState<string>(() => localISODate());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'confirmed' | 'hot'>('all');
  const [selectedPlayerForDrawer, setSelectedPlayerForDrawer] = useState<HrWatchRow | null>(null);

  const isToday = selectedDate === localISODate();

  // Load leaderboard & HR model candidate data to enrich player cards with HR Score / Edge rationale
  const leaderboardQuery = usePlayerVouchLeaderboard(selectedDate, 25);
  const toggleVouchMutation = useTogglePlayerVouch();
  const dailyBoard = useDailyHrBoard(selectedDate);

  const leaderboardData = leaderboardQuery.data ?? [];
  const hrRows: HrWatchRow[] = useMemo(() => {
    if (!dailyBoard.data) return [];
    return [...(dailyBoard.data.candidates ?? []), ...(dailyBoard.data.projectedCandidates ?? [])] as unknown as HrWatchRow[];
  }, [dailyBoard.data]);

  // Map HR score data into leaderboard items
  const enrichedLeaderboard = useMemo(() => {
    return leaderboardData.map((item, index) => {
      const hrMatch = hrRows.find((r) => String(r.playerId) === String(item.playerId));
      return {
        ...item,
        rank: index + 1,
        hitterPower: hrMatch?.hitterPower,
        pitcherVulnerability: hrMatch?.pitcherVulnerability,
        parkFactor: hrMatch?.parkFactor,
        hrScore: hrMatch?.hrScore,
        primaryReason: hrMatch?.reasons?.[0],
        truthStatus: hrMatch?.truthStatus,
      };
    });
  }, [leaderboardData, hrRows]);

  // Filter items based on search and selected mode
  const filteredPlayers = useMemo(() => {
    return enrichedLeaderboard.filter((p) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = p.playerName.toLowerCase().includes(query);
        const matchesTeam = (p.team ?? '').toLowerCase().includes(query);
        const matchesOpponent = (p.opponent ?? '').toLowerCase().includes(query);
        if (!matchesName && !matchesTeam && !matchesOpponent) return false;
      }

      if (filterMode === 'confirmed') {
        if (p.truthStatus !== 'official') return false;
      }
      if (filterMode === 'hot') {
        if (p.totalVouches < 2) return false;
      }

      return true;
    });
  }, [enrichedLeaderboard, searchTerm, filterMode]);

  const top3 = enrichedLeaderboard.slice(0, 3);
  const totalCommunityVotes = useMemo(
    () => enrichedLeaderboard.reduce((acc, curr) => acc + curr.totalVouches, 0),
    [enrichedLeaderboard]
  );

  const handleToggleVouch = (player: PlayerVouchSummary) => {
    toggleVouchMutation.mutate({
      playerId: player.playerId,
      playerName: player.playerName,
      team: player.team,
      opponent: player.opponent,
      gamePk: player.gamePk,
      contextDate: selectedDate,
      sourcePage: 'most_vouched_today',
    });
  };

  const handleOpenDrawerForPlayerId = (playerId: string) => {
    const match = hrRows.find((r) => String(r.playerId) === String(playerId));
    if (match) {
      setSelectedPlayerForDrawer(match);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden min-w-0 bg-[#060c14] text-white p-3 sm:p-6 space-y-6">
      <div className="mx-auto max-w-[1500px] w-full space-y-6">

        {/* ── Top Bar Header ────────────────────────────────────────── */}
        <header className="flex flex-col gap-4 rounded-2xl border border-white/12 bg-gradient-to-r from-[#0c1827] via-[#08121f] to-[#060c14] p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('hr_board')}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-slate-300 hover:border-vouch-cyan hover:text-vouch-cyan transition"
                  title="Back to HR Board"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
                    <Flame className="h-4 w-4 fill-current" />
                  </span>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">
                    Most Vouched Today
                  </h1>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-slate-300">
                  Community-backed Home Run edges ranked by real bettor vouches & model scores.
                </p>
              </div>
            </div>

            {/* Date Selector & Refresh */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => leaderboardQuery.refetch()}
                disabled={leaderboardQuery.isFetching}
                aria-label="Refresh leaderboard"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-vouch-cyan hover:border-vouch-cyan transition disabled:opacity-40"
              >
                <RefreshCw className={`h-4 w-4 ${leaderboardQuery.isFetching ? 'animate-spin' : ''}`} />
              </button>

              <label className="relative flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-3 text-xs font-bold text-white">
                <Calendar className="h-4 w-4 text-vouch-cyan" />
                <span>{isToday ? 'Today' : selectedDate}</span>
                <ChevronDown className="h-4 w-4 text-white/40" />
                <input
                  type="date"
                  value={selectedDate}
                  max={localISODate()}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>

          {/* Metric Bar Ticker */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 font-mono text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <Heart className="h-4 w-4 text-vouch-emerald fill-current" />
              <span><strong className="text-white">{totalCommunityVotes}</strong> Total Vouches Placed</span>
            </div>

            <div className="flex items-center gap-2 text-slate-200">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span><strong className="text-white">{enrichedLeaderboard.length}</strong> Ranked Candidates</span>
            </div>

            <div className="flex items-center gap-2 text-vouch-cyan font-bold">
              <span className="h-2 w-2 rounded-full bg-vouch-cyan animate-pulse" />
              <span>Live Slate Sync Active</span>
            </div>
          </div>
        </header>

        {/* ── Top 3 Podium Spotlight ────────────────────────────────── */}
        {top3.length > 0 && (
          <MostVouchedPodium
            players={top3}
            onSelectPlayer={handleOpenDrawerForPlayerId}
            onToggleVouch={handleToggleVouch}
            onAddToSlip={onAddPlayerToSlip}
            vouchPendingId={toggleVouchMutation.isPending ? String(toggleVouchMutation.variables?.playerId) : null}
          />
        )}

        {/* ── Search & Filter Controls ──────────────────────────────── */}
        <section className="flex flex-col gap-3 rounded-xl border border-white/12 bg-[#0a121d] p-3.5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vouch-cyan" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by player or team name..."
              className="h-10 w-full rounded-lg border border-white/15 bg-black/40 pl-9 pr-4 font-mono text-xs text-white placeholder:text-zinc-500 outline-none transition focus:border-vouch-cyan focus:ring-1 focus:ring-vouch-cyan/30"
            />
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`h-9 px-3 rounded-lg border font-bold uppercase transition ${
                filterMode === 'all'
                  ? 'border-vouch-cyan bg-vouch-cyan/20 text-vouch-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'border-white/10 bg-black/30 text-slate-400 hover:text-white'
              }`}
            >
              All Signals ({enrichedLeaderboard.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('confirmed')}
              className={`h-9 px-3 rounded-lg border font-bold uppercase transition ${
                filterMode === 'confirmed'
                  ? 'border-vouch-emerald bg-vouch-emerald/20 text-vouch-emerald shadow-[0_0_10px_rgba(0,255,148,0.2)]'
                  : 'border-white/10 bg-black/30 text-slate-400 hover:text-white'
              }`}
            >
              Confirmed Lineups
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('hot')}
              className={`h-9 px-3 rounded-lg border font-bold uppercase transition ${
                filterMode === 'hot'
                  ? 'border-amber-400 bg-amber-400/20 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                  : 'border-white/10 bg-black/30 text-slate-400 hover:text-white'
              }`}
            >
              Hot Momentum 🔥
            </button>
          </div>
        </section>

        {/* ── Main Community Board Grid ─────────────────────────────── */}
        <main>
          {leaderboardQuery.isLoading ? (
            <div className="rounded-xl border border-white/10 bg-black/30 p-12 text-center text-slate-400 font-mono">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-vouch-cyan mb-3" />
              Loading community vouches...
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-black/30 p-12 text-center text-slate-300">
              <Filter className="mx-auto h-8 w-8 text-slate-500 mb-2" />
              <h3 className="text-base font-bold text-white">No players found</h3>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search or filter selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full min-w-0 max-w-full">
              {filteredPlayers.map((player) => (
                <MostVouchedCard
                  key={`${player.playerId}-board`}
                  player={player}
                  onSelectPlayer={handleOpenDrawerForPlayerId}
                  onToggleVouch={handleToggleVouch}
                  onAddToSlip={onAddPlayerToSlip}
                  isPending={toggleVouchMutation.isPending && String(toggleVouchMutation.variables?.playerId) === String(player.playerId)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Deep-dive Player Profile Drawer */}
      <HrPlayerDrawer
        player={selectedPlayerForDrawer}
        isOpen={Boolean(selectedPlayerForDrawer)}
        onClose={() => setSelectedPlayerForDrawer(null)}
      />
    </div>
  );
}

export default MostVouchedTodayPageZ8;
