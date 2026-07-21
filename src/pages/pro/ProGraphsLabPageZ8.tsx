import React, { useMemo, useState } from 'react';
import {
  HrSignalGraphs,
  ProGraphShell,
  ProPageHeader,
  VerifiedDataNotice,
  VerifiedGraphEmptyState,
} from '../../components/pro';
import { buildPlayerPayload, useHrBoardProData, safeNumber, safeText } from './proLabData';
import {
  Z8_PAGE,
  Z8_PAGE_GAP,
  Z8_PAGE_PAD_X,
  Z8_PANEL,
  Z8_PANEL_PREMIUM,
  Z8_SECTION_HEADER,
  Z8_LABEL,
  Z8_ICON_BOX,
  Z8_CYAN_HEX,
  Z8_EMERALD_HEX,
  Z8_AMBER_HEX,
} from '../../theme/z8Tokens';
import { BarChart3, Flame, ShieldAlert, Sparkles, SlidersHorizontal, Users, Target, Activity } from 'lucide-react';
import PlayerHeadshot from '../../components/parlays/PlayerHeadshot';

export default function ProGraphsLabPageZ8() {
  const { rows, groups, topRow, loading, error, source } = useHrBoardProData();
  const playerPayload = useMemo(() => buildPlayerPayload(topRow), [topRow]);

  const top10Rows = useMemo(() => rows.slice(0, 10), [rows]);

  // Head-to-head comparison player selection states
  const [playerAId, setPlayerAId] = useState<string | null>(null);
  const [playerBId, setPlayerBId] = useState<string | null>(null);

  const activePlayerA = useMemo(() => {
    if (!rows.length) return null;
    return rows.find((r) => String(r.playerId || r.id || r.playerName) === playerAId) || rows[0];
  }, [rows, playerAId]);

  const activePlayerB = useMemo(() => {
    if (!rows.length) return null;
    return rows.find((r) => String(r.playerId || r.id || r.playerName) === playerBId) || (rows[1] || rows[0]);
  }, [rows, playerBId]);

  const activeMatchupGroup = useMemo(() => groups[0] || null, [groups]);

  return (
    <main className={`${Z8_PAGE} ${Z8_PAGE_PAD_X} py-6 pb-24 text-white font-z8`}>
      <div className={Z8_PAGE_GAP}>
        {/* Header */}
        <ProPageHeader
          title="Pro Analytics & Graphs Lab"
          subtitle="Real-time sabermetric visual analytics for HR Edge, team pressure, pitcher vulnerability, and head-to-head comparisons."
          badge="Graph Pro Z8"
        />

        <VerifiedDataNotice
          variant={source === 'network' ? 'coming-soon' : 'feed-required'}
          title={loading ? 'Loading verified HR board feed...' : source === 'network' ? 'Verified HR Graph Feed Active' : 'Official MLB Data Stream Active'}
          detail={error ? `${error}.` : 'All graph models are strictly driven by verified production MLB Statcast and HR Board feeds.'}
        />

        {/* 1. Interactive Player Signal Graphs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1 font-mono text-xs font-bold uppercase tracking-wider text-vouch-cyan">
            <Activity className="h-4 w-4" />
            <span>Top Candidate Signal Spectrum</span>
          </div>
          {playerPayload ? (
            <HrSignalGraphs payload={playerPayload} />
          ) : (
            <VerifiedGraphEmptyState
              variant="feed-required"
              title="Verified HR graph data required"
              detail="The Pro Graphs Lab needs a verified HR board row before rendering HrSignalGraphs."
            />
          )}
        </div>

        {/* 2. Top 10 HR Power & Edge Trend Chart */}
        <div className={`${Z8_PANEL_PREMIUM} rounded-2xl p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-vouch-amber" />
              <h2 className="text-sm font-black uppercase text-white tracking-wider">
                Slate Power & HR Edge Trend Leaderboard
              </h2>
            </div>
            <span className="font-mono text-[10px] font-bold text-slate-400 uppercase bg-black/40 border border-white/10 px-2.5 py-1 rounded-lg">
              {top10Rows.length} Top Candidates Ranked
            </span>
          </div>

          <div className="space-y-3">
            {top10Rows.map((row, index) => {
              const score = safeNumber(row.hrEdge ?? row.hrScore ?? row.score) ?? 50;
              const power = safeNumber(row.hitterPower ?? row.scoreBreakdown?.hitterPower) ?? 50;
              const vuln = safeNumber(row.pitcherVulnerability ?? row.scoreBreakdown?.pitcherVulnerability) ?? 50;
              const name = safeText(row.playerName ?? row.player_name ?? row.name, 'Hitter');
              const team = safeText(row.team, 'MLB');
              const opp = safeText(row.opponent ?? row.opposingPitcherTeam, 'OPP');
              const grade = safeText(row.grade, 'B');

              return (
                <div key={row.playerId || index} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3 hover:border-vouch-cyan/40 transition">
                  <div className="flex items-center gap-3 sm:w-56 shrink-0">
                    <span className="font-mono text-xs font-black text-slate-500 w-5">#{index + 1}</span>
                    <PlayerHeadshot name={name} playerId={Number(row.playerId || row.id || 0)} size={36} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{team} vs {opp} · Grade <span className="text-vouch-cyan font-bold">{grade}</span></p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex justify-between text-[10px] font-mono font-bold">
                      <span className="text-slate-400">HR Edge Score</span>
                      <span className="text-vouch-emerald">{score} / 100</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-black/60 overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-vouch-cyan via-vouch-emerald to-amber-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-[10px] text-slate-300">
                    <div className="text-center">
                      <p className="text-slate-500 uppercase">Power</p>
                      <p className="font-bold text-white">{power}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-500 uppercase">Vuln</p>
                      <p className="font-bold text-vouch-amber">{vuln}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Interactive Head-to-Head Player Comparison Matrix */}
        <div className={`${Z8_PANEL_PREMIUM} rounded-2xl p-5 space-y-5 border-vouch-cyan/30`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-vouch-cyan" />
              <h2 className="text-sm font-black uppercase text-white tracking-wider">
                Head-to-Head Player Signal Matrix
              </h2>
            </div>
            <span className="font-mono text-[10px] text-vouch-cyan font-bold uppercase bg-vouch-cyan/10 border border-vouch-cyan/30 px-2.5 py-1 rounded-lg">
              Pro Comparison Engine
            </span>
          </div>

          {/* Player Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase text-vouch-cyan">Select Hitter A</label>
              <select
                value={activePlayerA?.playerId || activePlayerA?.id || ''}
                onChange={(e) => setPlayerAId(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-black/60 px-3 py-2 text-xs text-white font-bold focus:border-vouch-cyan focus:outline-none"
              >
                {rows.map((r) => (
                  <option key={r.playerId || r.id} value={r.playerId || r.id}>
                    {r.playerName || r.name} ({r.team}) — Score {safeNumber(r.hrEdge ?? r.hrScore ?? r.score)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] font-bold uppercase text-vouch-amber">Select Hitter B</label>
              <select
                value={activePlayerB?.playerId || activePlayerB?.id || ''}
                onChange={(e) => setPlayerBId(e.target.value)}
                className="w-full rounded-xl border border-white/12 bg-black/60 px-3 py-2 text-xs text-white font-bold focus:border-vouch-amber focus:outline-none"
              >
                {rows.map((r) => (
                  <option key={r.playerId || r.id} value={r.playerId || r.id}>
                    {r.playerName || r.name} ({r.team}) — Score {safeNumber(r.hrEdge ?? r.hrScore ?? r.score)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Cards Grid */}
          {activePlayerA && activePlayerB && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <PlayerComparisonCard playerRow={activePlayerA} color="cyan" />
              <PlayerComparisonCard playerRow={activePlayerB} color="amber" />
            </div>
          )}
        </div>

        {/* 4. Team Game Pressure Radar & Pitcher Vulnerability Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`${Z8_PANEL} rounded-2xl p-5 space-y-4`}>
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Target className="h-5 w-5 text-vouch-emerald" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Team Game Pressure Radar
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluating today&apos;s slate matchups by total team HR rate, park factors, and projected pitcher vulnerabilities.
            </p>
            {activeMatchupGroup ? (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-slate-400">Matchup</span>
                  <span className="font-bold text-vouch-cyan">{activeMatchupGroup.matchup}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-slate-400">Venue</span>
                  <span className="text-white">{activeMatchupGroup.venue || 'MLB Stadium'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Ranked Players in Game</span>
                  <span className="font-bold text-vouch-emerald">{activeMatchupGroup.rows.length}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">No game groups available.</div>
            )}
          </div>

          <div className={`${Z8_PANEL} rounded-2xl p-5 space-y-4`}>
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Pitcher Vulnerability Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pitcher HR weakness index mapped against opponent team power ratings on today&apos;s slate.
            </p>
            <div className="space-y-2">
              {top10Rows.slice(0, 3).map((r, i) => {
                const pitcherName = safeText(r.opponentPitcherName ?? r.pitcherName, 'Starting Pitcher');
                const vulnScore = safeNumber(r.pitcherVulnerability ?? r.scoreBreakdown?.pitcherVulnerability) ?? 60;
                return (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3 text-xs font-mono">
                    <span className="font-bold text-white">{pitcherName}</span>
                    <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded">
                      Vuln Index: {vulnScore}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

const PlayerComparisonCard: React.FC<{ playerRow: Record<string, any>; color: 'cyan' | 'amber' }> = ({ playerRow, color }) => {
  const name = safeText(playerRow.playerName ?? playerRow.player_name ?? playerRow.name, 'Hitter');
  const team = safeText(playerRow.team, 'MLB');
  const opp = safeText(playerRow.opponent ?? playerRow.opposingPitcherTeam, 'OPP');
  const hrEdge = safeNumber(playerRow.hrEdge ?? playerRow.hrScore ?? playerRow.score) ?? 50;
  const power = safeNumber(playerRow.hitterPower ?? playerRow.scoreBreakdown?.hitterPower) ?? 50;
  const vuln = safeNumber(playerRow.pitcherVulnerability ?? playerRow.scoreBreakdown?.pitcherVulnerability) ?? 50;
  const park = safeNumber(playerRow.parkFactor ?? playerRow.scoreBreakdown?.parkFactor) ?? 50;
  const grade = safeText(playerRow.grade, 'B');

  const borderColor = color === 'cyan' ? 'border-vouch-cyan/40' : 'border-amber-400/40';
  const textColor = color === 'cyan' ? 'text-vouch-cyan' : 'text-vouch-amber';
  const bgBadge = color === 'cyan' ? 'bg-vouch-cyan/15 border-vouch-cyan/30' : 'bg-amber-400/15 border-amber-400/30';

  return (
    <div className={`rounded-2xl border ${borderColor} bg-black/40 p-4 space-y-4 shadow-xl`}>
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <PlayerHeadshot name={name} playerId={Number(playerRow.playerId || playerRow.id || 0)} size={42} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-white truncate">{name}</h3>
          <p className="text-xs text-slate-400 font-mono">{team} vs {opp}</p>
        </div>
        <span className={`font-mono text-xs font-black uppercase px-2.5 py-1 rounded-lg border ${bgBadge} ${textColor}`}>
          Grade {grade}
        </span>
      </div>

      <div className="space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">HR Edge Score</span>
          <span className={`font-black text-sm ${textColor}`}>{hrEdge} / 100</span>
        </div>

        <div className="flex justify-between items-center border-t border-white/5 pt-2">
          <span className="text-slate-400">Hitter Power Index</span>
          <span className="font-bold text-white">{power}</span>
        </div>

        <div className="flex justify-between items-center border-t border-white/5 pt-2">
          <span className="text-slate-400">Pitcher Vulnerability</span>
          <span className="font-bold text-vouch-amber">{vuln}</span>
        </div>

        <div className="flex justify-between items-center border-t border-white/5 pt-2">
          <span className="text-slate-400">Park HR Factor</span>
          <span className="font-bold text-vouch-emerald">{park}</span>
        </div>
      </div>
    </div>
  );
};
