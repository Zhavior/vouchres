import React, { useMemo } from "react";
import {
  Layers,
  Flame,
  Plus,
} from "lucide-react";
import type { ChunkA } from "../../api/contracts";
import { PlayerHeadshot } from "../PlayerHeadshot";
import { logoByTeamName } from "../../../../lib/teamLogos";
import { openParlayAdd } from "../../../../lib/parlays/parlayAddContract";
import {
  AuroraMaxControl,
  AuroraMaxFallback,
  AuroraMaxPanel,
} from "../../../../components/aurora-max/AuroraMaxPrimitives";

interface Props {
  data: ChunkA[];
}

interface TeamStack {
  team: string;
  teamLogoUrl: string | null;
  opponent: string;
  pitcherName: string;
  players: ChunkA[];
  totalHrScore: number;
  avgHrScore: number;
  maxHrScore: number;
  avgPower: number;
  stackRank: number;
}

export function ChunkASlateStacks({ data }: Props) {
  const teamStacks = useMemo<TeamStack[]>(() => {
    const map = new Map<string, ChunkA[]>();

    for (const row of data) {
      if (!row.identity.teamAbbreviation) continue;
      const teamKey = row.identity.teamAbbreviation.toUpperCase();
      const existing = map.get(teamKey) || [];
      existing.push(row);
      map.set(teamKey, existing);
    }

    const stacks: TeamStack[] = [];

    map.forEach((teamPlayers, teamName) => {
      const sortedPlayers = [...teamPlayers].sort((a, b) => b.score.hrIndex - a.score.hrIndex);

      const totalHrScore = sortedPlayers.reduce((sum, p) => sum + (p.score.hrIndex || 0), 0);
      const avgHrScore = Math.round(totalHrScore / sortedPlayers.length);
      const maxHrScore = sortedPlayers[0]?.score.hrIndex || 0;

      const totalPower = sortedPlayers.reduce(
        (sum, p) => sum + (p.score.hrIndex),
        0,
      );
      const avgPower = Math.round(totalPower / sortedPlayers.length);

      const topPlayer = sortedPlayers[0];
      const opponent = topPlayer?.opponentTeamId || "OPP";
      const pitcherName = topPlayer?.opposingPitcherName || "Pitcher TBD";
      const teamLogoUrl = logoByTeamName(teamName);

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

    stacks.sort((a, b) => {
      const scoreA = a.totalHrScore + a.avgPower;
      const scoreB = b.totalHrScore + b.avgPower;
      return scoreB - scoreA;
    });

    return stacks.map((stack, idx) => ({ ...stack, stackRank: idx + 1 }));
  }, [data]);

  const handleAddStackToSlip = (stack: TeamStack) => {
    const topLegs = stack.players.slice(0, 3);
    topLegs.forEach((player) => {
      openParlayAdd({
        player: {
          id: player.playerId,
          name: player.identity.name,
          team: player.identity.teamAbbreviation,
          position: "",
          propositions: [],
        },
        propHint: {
          id: `hr-stack-${player.playerId}`,
          market: "Home Runs",
          odds: player.odds?.price ?? null,
          spec: `${player.identity.name} 1+ Home Run`,
          gamePk: player.gameState.gameId,
          playerId: player.playerId,
        },
        initialFamily: "home_runs",
        isPitcher: false,
        source: "hr_intelligence",
        dataStatus: player.lineupStatus === "confirmed_starter" ? "official" : "projected",
      });
    });
  };

  const handleAddSinglePlayer = (player: ChunkA) => {
    openParlayAdd({
      player: {
        id: player.playerId,
        name: player.identity.name,
        team: player.identity.teamAbbreviation,
        position: "",
        propositions: [],
      },
      propHint: {
        id: `hr-single-${player.playerId}`,
        market: "Home Runs",
        odds: player.odds?.price ?? null,
        spec: `${player.identity.name} 1+ Home Run`,
        gamePk: player.gameState.gameId,
        playerId: player.playerId,
      },
      initialFamily: "home_runs",
      isPitcher: false,
      source: "hr_intelligence",
      dataStatus: player.lineupStatus === "confirmed_starter" ? "official" : "projected",
    });
  };

  if (data.length === 0 || teamStacks.length === 0) {
    return (
      <AuroraMaxFallback title="No slate stacks available" detail="Team stacks appear only when slate lineup rows exist. Missing lineup evidence is never replaced with an estimated stack." />
    );
  }

  return (
    <section className="hr-slate-stacks aurora-max-ranked-workspace space-y-4" data-workspace="stacks">
      <AuroraMaxPanel className="relative overflow-hidden p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="aurora-max-eyebrow inline-flex items-center gap-1.5 border px-3 py-1">
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

          <AuroraMaxPanel className="p-4 text-center">
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">Team Stacks Ranked</span>
            <div className="mt-1 font-mono text-3xl font-black text-vouch-cyan">{teamStacks.length}</div>
          </AuroraMaxPanel>
        </div>
      </AuroraMaxPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        {teamStacks.map((stack) => {
          const isTopRanked = stack.stackRank === 1;

          return (
            <AuroraMaxPanel
              key={stack.team}
              className={`group relative overflow-hidden transition-all duration-300 ${
                isTopRanked
                  ? "border-emerald-400/40 hover:border-emerald-400 hover:shadow-[0_0_40px_rgba(52,211,153,0.12)]"
                  : "hover:border-vouch-cyan/40 hover:shadow-[0_0_30px_rgba(0,217,160,0.10)]"
              }`}
            >
              <div className="border-b border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
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

                  <div className="text-right">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">Stack Rating</span>
                    <div className="font-mono text-2xl font-black text-vouch-cyan">
                      {stack.avgHrScore} <span className="text-xs font-normal text-white/40">AVG</span>
                    </div>
                  </div>
                </div>
              </div>

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
                    <AuroraMaxPanel
                      key={player.playerId}
                      className="flex items-center justify-between p-3 transition hover:border-vouch-cyan/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-white/30">#{pIdx + 1}</span>
                        <PlayerHeadshot name={player.identity.name} mlbId={player.identity.mlbId} size={36} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-white">{player.identity.name}</h4>
                          </div>
                          <span className="font-mono text-[10px] text-white/50">
                            Power: {player.score.hrIndex}
                            {player.odds?.price ? ` • Odds: ${player.odds.price > 0 ? '+' : ''}${player.odds.price}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right font-mono">
                          <span className="text-[9px] uppercase text-white/40">HR Score</span>
                          <div className="text-sm font-extrabold text-vouch-cyan">{player.score.hrIndex}</div>
                        </div>

                        <AuroraMaxControl
                          type="button"
                          onClick={() => handleAddSinglePlayer(player)}
                          title="Add single leg to slip"
                          aria-label={`Add ${player.identity.name} to slip`}
                          className="h-8 w-8 justify-center p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </AuroraMaxControl>
                      </div>
                    </AuroraMaxPanel>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
                <div className="flex items-center gap-2 font-mono text-[10px] text-white/40">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  <span>High Correlation Multi-Leg HR Parlay</span>
                </div>

                <AuroraMaxControl
                  tone="primary"
                  onClick={() => handleAddStackToSlip(stack)}
                  className="gap-2 px-4 py-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Team Stack to Slip
                </AuroraMaxControl>
              </div>
            </AuroraMaxPanel>
          );
        })}
      </div>
    </section>
  );
}
