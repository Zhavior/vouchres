import React, { useMemo, useState } from 'react';
import {
  Heart,
  Flame,
  Search,
  Calendar,
  ChevronDown,
  RefreshCw,
  Trophy,
  Filter,
  ArrowLeft,
  ArrowUpDown,
} from 'lucide-react';
import {
  usePlayerVouchLeaderboard,
  useTogglePlayerVouch,
  PlayerVouchSummary,
} from '../hooks/queries/usePlayerVouchLayer';
import { useDailyHrBoard } from '../features/hr/hooks/useDailyHrBoard';
import { MostVouchedPodium } from '../features/hr/components/Social/MostVouchedPodium';
import { MostVouchedCard } from '../features/hr/components/Social/MostVouchedCard';
import HrPlayerDrawer from '../features/hr/components/Drawer/HrPlayerDrawer';
import { localISODate } from '../features/hr/utils/localDate';
import type { HrWatchRow } from '../features/hr/types/hrWatch';
import { openParlayAdd } from '../lib/parlays/parlayAddContract';
import { toHrParlayPickerPlayer } from '../features/hr/utils/hrDecisionBrief';
import {
  AuroraMaxEyebrow,
  AuroraMaxControl,
} from '../components/aurora-max/AuroraMaxPrimitives';

export interface MostVouchedTodayPageZ8Props {
  onNavigate?: (section: string) => void;
  onAddPlayerToSlip?: (player: any) => void;
}

export function MostVouchedTodayPageZ8({
  onNavigate,
  onAddPlayerToSlip,
}: MostVouchedTodayPageZ8Props) {
  const [selectedDate, setSelectedDate] = useState<string>(() => localISODate());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'confirmed' | 'hot' | 'elite'>('all');
  const [sortMode, setSortMode] = useState<'vouches' | 'score' | 'power'>('vouches');
  const [selectedPlayerForDrawer, setSelectedPlayerForDrawer] = useState<HrWatchRow | null>(null);

  const isToday = selectedDate === localISODate();

  const leaderboardQuery = usePlayerVouchLeaderboard(selectedDate, 30);
  const toggleVouchMutation = useTogglePlayerVouch();
  const dailyBoard = useDailyHrBoard(selectedDate);

  const leaderboardData = leaderboardQuery.data ?? [];
  const hrRows: HrWatchRow[] = useMemo(() => {
    if (!dailyBoard.data) return [];
    return [
      ...(dailyBoard.data.candidates ?? []),
      ...(dailyBoard.data.projectedCandidates ?? []),
    ] as unknown as HrWatchRow[];
  }, [dailyBoard.data]);

  const enrichedLeaderboard = useMemo(() => {
    const enriched = leaderboardData.map((item, index) => {
      const hrMatch = hrRows.find((r) => String(r.playerId) === String(item.playerId));
      return {
        ...item,
        rank: index + 1,
        hitterPower: hrMatch?.hitterPower,
        pitcherVulnerability: hrMatch?.pitcherVulnerability,
        parkFactor: hrMatch?.parkFactor,
        hrScore: hrMatch?.hrScore ?? 75,
        primaryReason: hrMatch?.reasons?.[0],
        truthStatus: hrMatch?.truthStatus ?? 'projected',
      };
    });

    if (enriched.length < 6 && hrRows.length > 0) {
      const existingIds = new Set(enriched.map((e) => String(e.playerId)));
      const extras = hrRows
        .filter((r) => !existingIds.has(String(r.playerId)))
        .slice(0, 12 - enriched.length)
        .map((r, i) => ({
          playerId: String(r.playerId),
          playerName: r.playerName,
          team: r.team ?? null,
          opponent: r.opponent ?? null,
          gamePk: r.gamePk != null ? String(r.gamePk) : null,
          totalVouches: 0,
          viewerHasVouched: false,
          rank: enriched.length + i + 1,
          hitterPower: r.hitterPower,
          pitcherVulnerability: r.pitcherVulnerability,
          parkFactor: r.parkFactor,
          hrScore: r.hrScore ?? 75,
          primaryReason: r.reasons?.[0],
          truthStatus: r.truthStatus ?? 'projected',
        }));
      return [...enriched, ...extras];
    }

    return enriched;
  }, [leaderboardData, hrRows]);

  const filteredPlayers = useMemo(() => {
    let result = enrichedLeaderboard.filter((p) => {
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
      if (filterMode === 'elite') {
        if ((p.hrScore ?? 0) < 85) return false;
      }

      return true;
    });

    if (sortMode === 'score') {
      result = [...result].sort((a, b) => (b.hrScore ?? 0) - (a.hrScore ?? 0));
    } else if (sortMode === 'power') {
      result = [...result].sort((a, b) => (b.hitterPower ?? 0) - (a.hitterPower ?? 0));
    } else {
      result = [...result].sort((a, b) => b.totalVouches - a.totalVouches);
    }

    return result;
  }, [enrichedLeaderboard, searchTerm, filterMode, sortMode]);

  const top3 = useMemo(() => enrichedLeaderboard.slice(0, 3), [enrichedLeaderboard]);
  const totalCommunityVotes = useMemo(
    () => leaderboardData.reduce((acc, curr) => acc + curr.totalVouches, 0),
    [leaderboardData]
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

  const handleAddToSlip = (player: PlayerVouchSummary) => {
    if (onAddPlayerToSlip) {
      onAddPlayerToSlip(player);
      return;
    }

    const hrMatch = hrRows.find((r) => String(r.playerId) === String(player.playerId));
    if (hrMatch) {
      openParlayAdd({
        player: toHrParlayPickerPlayer(hrMatch),
        propHint: {
          id: `hr-vouch-${hrMatch.stableId || hrMatch.playerId}`,
          market: 'Home Runs',
          odds: hrMatch.bookOdds ?? null,
          spec: `${hrMatch.playerName} 1+ Home Run`,
          gamePk: hrMatch.gamePk ?? undefined,
          playerId: hrMatch.playerId ?? undefined,
        },
        initialFamily: 'home_runs',
        isPitcher: false,
        source: 'hr_intelligence',
        dataStatus: hrMatch.truthStatus === 'official' ? 'official' : 'projected',
        reasoningSnapshot: hrMatch.reasons?.[0] ?? null,
        riskSnapshot: hrMatch.warnings?.[0] ?? null,
      });
    } else {
      openParlayAdd({
        player: {
          id: String(player.playerId),
          name: player.playerName,
          team: player.team ?? 'MLB',
          position: '',
          headshot: '',
          propositions: [],
          ...(player.gamePk == null ? {} : { resolvedGamePk: String(player.gamePk) }),
        },
        initialFamily: 'home_runs',
        isPitcher: false,
        source: 'hr_intelligence',
        dataStatus: 'projected',
      });
    }
  };

  return (
    <div className="aurora-max-shell min-h-screen w-full max-w-full min-w-0 p-3 sm:p-5 space-y-4 font-z8 text-[var(--aurora-max-paper)]">
      <div className="mx-auto max-w-[1500px] w-full space-y-4">

        {/* ── Top Command Header ───────────────────────────────────── */}
        <header className="aurora-max-panel relative border border-[var(--aurora-max-line)] bg-[rgba(5,12,13,0.65)] p-4 sm:p-5 shadow-[var(--aurora-max-shadow)] backdrop-blur-[18px] space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {onNavigate && (
                <AuroraMaxControl
                  onClick={() => onNavigate('hr_board')}
                  className="!min-h-10 !w-10 !p-0"
                  title="Back to HR Board"
                >
                  <ArrowLeft className="h-4 w-4" />
                </AuroraMaxControl>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center border border-[rgba(217,156,74,0.35)] bg-[rgba(217,156,74,0.12)] text-[var(--aurora-max-amber)]">
                    <Flame className="h-3.5 w-3.5 fill-current" />
                  </span>
                  <div>
                    <AuroraMaxEyebrow className="!text-[9px] font-black uppercase tracking-[0.2em] text-[var(--aurora-max-amber)]">
                      COMMUNITY CONSENSUS · REAL BETTOR VOUCHES
                    </AuroraMaxEyebrow>
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[var(--aurora-max-paper)] leading-none mt-0.5">
                      Most Vouched Today
                    </h1>
                  </div>
                </div>
                <p className="mt-1 text-xs text-[var(--aurora-max-muted)] max-w-2xl">
                  Live crowd-sourced home run conviction cross-verified against 12-layer predictive ML matchup metrics.
                </p>
              </div>
            </div>

            {/* Date Selector & Refresh */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <AuroraMaxControl
                onClick={() => leaderboardQuery.refetch()}
                disabled={leaderboardQuery.isFetching}
                aria-label="Refresh leaderboard"
                className="!min-h-9 !w-9 !p-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${leaderboardQuery.isFetching ? 'animate-spin' : ''}`} />
              </AuroraMaxControl>

              <label className="relative flex h-9 items-center gap-2 border border-[var(--aurora-max-line)] bg-[rgba(4,11,13,0.72)] px-3 text-xs font-mono text-[var(--aurora-max-paper)] cursor-pointer hover:border-[var(--aurora-max-line-strong)] transition">
                <Calendar className="h-3.5 w-3.5 text-[var(--aurora-max-emerald)]" />
                <span>{isToday ? 'Today' : selectedDate}</span>
                <ChevronDown className="h-3 w-3 text-[var(--aurora-max-muted)]" />
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--aurora-max-line)] bg-[rgba(3,8,10,0.55)] px-4 py-2 font-mono text-xs">
            <div className="flex items-center gap-2 text-[var(--aurora-max-paper)]">
              <Heart className="h-3.5 w-3.5 text-[var(--aurora-max-emerald)] fill-current" />
              <span>
                <strong className="text-[var(--aurora-max-emerald)]">{totalCommunityVotes}</strong> Total Vouches Placed
              </span>
            </div>

            <div className="flex items-center gap-2 text-[var(--aurora-max-paper)]">
              <Trophy className="h-3.5 w-3.5 text-[var(--aurora-max-amber)]" />
              <span>
                <strong>{enrichedLeaderboard.length}</strong> Ranked Candidates
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[var(--aurora-max-emerald)] font-bold text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--aurora-max-emerald)] animate-pulse" />
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
            onAddToSlip={handleAddToSlip}
            vouchPendingId={
              toggleVouchMutation.isPending
                ? String(toggleVouchMutation.variables?.playerId)
                : null
            }
          />
        )}

        {/* ── Search & Filter Controls ──────────────────────────────── */}
        <section className="aurora-max-panel flex flex-col gap-3 border border-[var(--aurora-max-line)] bg-[rgba(5,12,13,0.65)] p-3.5 backdrop-blur-[18px] sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--aurora-max-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate by player or team name..."
              className="h-9 w-full border border-[var(--aurora-max-line)] bg-[rgba(3,9,11,0.76)] pl-9 pr-3 font-mono text-xs text-[var(--aurora-max-paper)] placeholder:text-[var(--aurora-max-muted)] outline-none transition focus:border-[var(--aurora-max-line-strong)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0 font-mono text-xs">
            <AuroraMaxControl
              tone={filterMode === 'all' ? 'primary' : 'neutral'}
              onClick={() => setFilterMode('all')}
              className="!min-h-8 !px-2.5 !text-[10px]"
            >
              All ({enrichedLeaderboard.length})
            </AuroraMaxControl>
            <AuroraMaxControl
              tone={filterMode === 'confirmed' ? 'primary' : 'neutral'}
              onClick={() => setFilterMode('confirmed')}
              className="!min-h-8 !px-2.5 !text-[10px]"
            >
              Confirmed Lineups
            </AuroraMaxControl>
            <AuroraMaxControl
              tone={filterMode === 'hot' ? 'primary' : 'neutral'}
              onClick={() => setFilterMode('hot')}
              className="!min-h-8 !px-2.5 !text-[10px]"
            >
              🔥 Hot Heat
            </AuroraMaxControl>
            <AuroraMaxControl
              tone={filterMode === 'elite' ? 'primary' : 'neutral'}
              onClick={() => setFilterMode('elite')}
              className="!min-h-8 !px-2.5 !text-[10px]"
            >
              💎 Elite 85+
            </AuroraMaxControl>

            <div className="flex items-center gap-1 pl-2 border-l border-[var(--aurora-max-line)]">
              <AuroraMaxControl
                onClick={() =>
                  setSortMode((curr) =>
                    curr === 'vouches' ? 'score' : curr === 'score' ? 'power' : 'vouches'
                  )
                }
                className="!min-h-8 !px-2.5 !text-[10px]"
                title="Change sort criteria"
              >
                <ArrowUpDown className="h-3 w-3 text-[var(--aurora-max-emerald)]" />
                <span className="uppercase">
                  {sortMode === 'vouches' ? 'Vouches' : sortMode === 'score' ? 'HRPI Score' : 'PWR'}
                </span>
              </AuroraMaxControl>
            </div>
          </div>
        </section>

        {/* ── Main Community Board Grid ─────────────────────────────── */}
        <main>
          {leaderboardQuery.isLoading ? (
            <div className="border border-[var(--aurora-max-line)] bg-black/30 p-16 text-center text-[var(--aurora-max-muted)] font-mono text-xs">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[var(--aurora-max-emerald)] mb-3" />
              Loading live community vouches...
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="border border-dashed border-[var(--aurora-max-line)] bg-black/20 p-16 text-center text-[var(--aurora-max-muted)] font-mono text-xs">
              <Filter className="mx-auto h-6 w-6 text-[var(--aurora-max-muted)] mb-2" />
              <h3 className="text-sm font-bold text-[var(--aurora-max-paper)]">No players found</h3>
              <p className="mt-1">Try clearing your search or filter selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full min-w-0 max-w-full">
              {filteredPlayers.map((player) => (
                <MostVouchedCard
                  key={`${player.playerId}-board`}
                  player={player}
                  onSelectPlayer={handleOpenDrawerForPlayerId}
                  onToggleVouch={handleToggleVouch}
                  onAddToSlip={handleAddToSlip}
                  isPending={
                    toggleVouchMutation.isPending &&
                    String(toggleVouchMutation.variables?.playerId) === String(player.playerId)
                  }
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <HrPlayerDrawer
        player={selectedPlayerForDrawer}
        isOpen={Boolean(selectedPlayerForDrawer)}
        onClose={() => setSelectedPlayerForDrawer(null)}
      />
    </div>
  );
}

export default MostVouchedTodayPageZ8;
