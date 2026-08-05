import React, { useMemo } from "react";
import {
  Layers,
  Flame,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  Zap,
  Sparkles,
} from "lucide-react";
import type { HrWatchRow } from "../../../types/hrWatch";
import PlayerHeadshot from "../../../../../components/parlays/PlayerHeadshot";
import { logoByTeamName } from "../../../../../lib/teamLogos";
import { openParlayAdd } from "../../../../../lib/parlays/parlayAddContract";
import { toHrParlayPickerPlayer } from "../../../utils/hrDecisionBrief";
import { PlayerHrTag } from "../../HrHitBadge";

interface Props {
  rows: HrWatchRow[];
}

interface TeamStack {
  team: string;
  teamLogoUrl: string | null;
  opponent: string;
  pitcherName: string;
  players: HrWatchRow[];
  totalHrScore: number;
  avgHrScore: number;
  maxHrScore: number;
  avgPower: number;
  stackRank: number;
}

export default function SlateStacksView({ rows }: Props) {
  // Group rows by team and calculate stack scores
  const teamStacks = useMemo<TeamStack[]>(() => {
    const map = new Map<string, HrWatchRow[]>();

    for (const row of rows) {
      if (!row.team) continue;
      const teamKey = row.team.toUpperCase();
      const existing = map.get(teamKey) || [];
      existing.push(row);
      map.set(teamKey, existing);
    }

    const stacks: TeamStack[] = [];

    map.forEach((teamPlayers, teamName) => {
      // Sort players in team stack by HR score descending
      const sortedPlayers = [...teamPlayers].sort((a, b) => b.hrScore - a.hrScore);

      const totalHrScore = sortedPlayers.reduce((sum, p) => sum + (p.hrScore || 0), 0);
      const avgHrScore = Math.round(totalHrScore / sortedPlayers.length);
      const maxHrScore = sortedPlayers[0]?.hrScore || 0;

      const totalPower = sortedPlayers.reduce(
        (sum, p) => sum + (p.hitterPower ?? p.hrScore ?? 50),
        0,
      );
      const avgPower = Math.round(totalPower / sortedPlayers.length);

      const topPlayer = sortedPlayers[0];
      const opponent = topPlayer?.opponent || "OPP";
      const pitcherName = topPlayer?.pitcherName || "Pitcher TBD";
      const teamLogoUrl = topPlayer?.teamLogoUrl || logoByTeamName(teamName);

      stacks.push({
        team: teamName,
        teamLogoUrl,
        opponent,
        pitcherName,
        players: sortedPlayers,
        totalHrScore,
        avgHrScore,
        maxHrScore,
        avgPower,
        stackRank: 0,
      });
    });

    // Sort team stacks by total HR score & avg power descending
    stacks.sort((a, b) => {
      const scoreA = a.totalHrScore + a.avgPower;
      const scoreB = b.totalHrScore + b.avgPower;
      return scoreB - scoreA;
    });

    // Assign rank
    return stacks.map((stack, idx) => ({ ...stack, stackRank: idx + 1 }));
  }, [rows]);

  const handleAddStackToSlip = (stack: TeamStack) => {
    // Add top 2-3 players in stack to parlay slip
    const topLegs = stack.players.slice(0, 3);
    topLegs.forEach((player) => {
      openParlayAdd({
        player: toHrParlayPickerPlayer(player),
        propHint: {
          id: `hr-stack-${player.stableId}`,
          market: "Home Runs",
          odds: player.bookOdds ?? null,
          spec: `${player.playerName} 1+ Home Run`,
          gamePk: player.gamePk ?? undefined,
          playerId: player.playerId ?? undefined,
        },
        initialFamily: "home_runs",
        isPitcher: false,
        source: "hr_intelligence",
        dataStatus: player.truthStatus === "official" ? "official" : "projected",
        reasoningSnapshot: player.reasons[0] ?? null,
        riskSnapshot: player.warnings[0] ?? null,
      });
    });
  };

  const handleAddSinglePlayer = (player: HrWatchRow) => {
    openParlayAdd({
      player: toHrParlayPickerPlayer(player),
      propHint: {
        id: `hr-single-${player.stableId}`,
        market: "Home Runs",
        odds: player.bookOdds ?? null,
        spec: `${player.playerName} 1+ Home Run`,
        gamePk: player.gamePk ?? undefined,
        playerId: player.playerId ?? undefined,
      },
      initialFamily: "home_runs",
      isPitcher: false,
      source: "hr_intelligence",
      dataStatus: player.truthStatus === "official" ? "official" : "projected",
      reasoningSnapshot: player.reasons[0] ?? null,
      riskSnapshot: player.warnings[0] ?? null,
    });
  };

  if (rows.length === 0 || teamStacks.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-black/30 p-12 text-center backdrop-blur-xl">
        <Layers className="mx-auto h-10 w-10 text-vouch-cyan/40" />
        <h3 className="mt-3 text-lg font-bold text-white">No Slate Team Stacks Available</h3>
        <p className="mt-1 text-sm text-white/50">
          Waiting for slate lineup postings to generate multi-player team HR stacks.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* ── Header Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-vouch-cyan/25 bg-gradient-to-r from-vouch-cyan/10 via-black/60 to-emerald-500/10 p-6 backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-vouch-cyan/35 bg-vouch-cyan/10 px-3 py-1 font-mono text-[10px] font-extrabold uppercase tracking-widest text-vouch-cyan">
                <Layers className="h-3.5 w-3.5" />
                MLB Team Stacks
              </span>
              <span className="font-mono text-xs text-white/40">• High-Correlation HR Combos</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Slate Team Home Run Stacks
            </h1>
            <p className="max-w-2xl text-xs text-white/60 sm:text-sm">
              Target MLB team lineups facing vulnerable starters or hitting in high-run environments for correlated multi-leg HR parlay tickets.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-center backdrop-blur-md">
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">Team Stacks Ranked</span>
            <div className="mt-1 font-mono text-3xl font-black text-vouch-cyan">{teamStacks.length}</div>
          </div>
        </div>
      </div>

      {/* ── Team Stacks Grid ─────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {teamStacks.map((stack) => {
          const isTopRanked = stack.stackRank === 1;

          return (
            <div
              key={stack.team}
              className={`group relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-300 ${
                isTopRanked
                  ? "border-emerald-400/40 bg-gradient-to-br from-emerald-950/30 via-black/60 to-black hover:border-emerald-400 hover:shadow-[0_0_40px_rgba(52,211,153,0.15)]"
                  : "border-white/10 bg-gradient-to-br from-zinc-950/80 via-black/60 to-black hover:border-vouch-cyan/40 hover:shadow-[0_0_30px_rgba(79,184,220,0.12)]"
              }`}
            >
              {/* Stack Header */}
              <div className="border-b border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Team Logo / Badge */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/50 p-2 shadow-inner">
                      {stack.teamLogoUrl ? (
                        <img src={stack.teamLogoUrl} alt={stack.team} className="h-10 w-10 object-contain" />
                      ) : (
                        <span className="font-mono text-base font-black text-white">{stack.team}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-widest ${
                          isTopRanked
                            ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/40"
                            : "bg-vouch-cyan/10 text-vouch-cyan border border-vouch-cyan/30"
                        }`}>
                          #{stack.stackRank} HR Stack
                        </span>
                        <span className="font-mono text-xs text-white/50">vs {stack.opponent}</span>
                      </div>

                      <h3 className="mt-1 text-2xl font-black text-white">{stack.team} Home Run Stack</h3>
                      <p className="text-xs text-white/50">vs Pitcher: <strong className="text-white">{stack.pitcherName}</strong></p>
                    </div>
                  </div>

                  {/* Stack Power Metrics */}
                  <div className="text-right">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">Stack Rating</span>
                    <div className="font-mono text-2xl font-black text-vouch-cyan">
                      {stack.avgHrScore} <span className="text-xs font-normal text-white/40">AVG</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hitters in Stack */}
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                    Key Power Hitters ({stack.players.length})
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                    Max HR Score: {stack.maxHrScore}
                  </span>
                </div>

                <div className="space-y-2">
                  {stack.players.map((player, pIdx) => (
                    <div
                      key={player.stableId}
                      className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-3 transition hover:border-vouch-cyan/30 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-white/30">#{pIdx + 1}</span>
                        <PlayerHeadshot name={player.playerName} playerId={player.playerId} headshotUrl={player.headshotUrl} size={36} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-white">{player.playerName}</h4>
                            <PlayerHrTag player={player} compact />
                          </div>
                          <span className="font-mono text-[10px] text-white/50">
                            Power: {player.hitterPower ?? player.hrScore} • Odds: {player.oddsLabel || "+280"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right font-mono">
                          <span className="text-[9px] uppercase text-white/40">HR Score</span>
                          <div className="text-sm font-extrabold text-vouch-cyan">{player.hrScore}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddSinglePlayer(player)}
                          title="Add single leg to slip"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-white/70 transition hover:border-vouch-cyan hover:bg-vouch-cyan hover:text-black"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stack Footer Actions */}
              <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 bg-black/30">
                <div className="flex items-center gap-2 font-mono text-[10px] text-white/40">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  <span>High Correlation Multi-Leg HR Parlay</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddStackToSlip(stack)}
                  className="flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/20 px-4 py-2 font-mono text-xs font-bold text-emerald-300 transition duration-200 hover:bg-emerald-400 hover:text-black"
                >
                  <Plus className="h-4 w-4" />
                  Add Team Stack to Slip
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
