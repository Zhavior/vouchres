import React from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Flame,
  Plug,
  RefreshCw,
  Target,
  Zap,
  X,
} from 'lucide-react';

import { HrBrandIcon } from '../features/hr/components/HrBrandIcon';
import PlayerHeadshot from './parlays/PlayerHeadshot';
import PlayerResearchDecisionCard from './player/PlayerResearchDecisionCard';
import AgentDock from './agents/AgentDock';
import ProGraphsLabPageZ8 from '../pages/pro/ProGraphsLabPageZ8';
import VerdictPanel from "@/features/brain-edge/components/VerdictPanel";

import { useMlbIntelligenceHub } from '../features/mlb/hooks/useMlbIntelligenceHub';
import { PixelAgentIcon } from '../features/mlb/components/MlbIntelligenceHub/PixelAgentIcon';
import { StatTile } from '../features/mlb/components/MlbIntelligenceHub/StatTile';
import { CandidateCard } from '../features/mlb/components/MlbIntelligenceHub/CandidateCard';
import { JudgeCard } from '../features/mlb/components/MlbIntelligenceHub/JudgeCard';
import { Props, Tab } from '../features/mlb/components/MlbIntelligenceHub/types';
import { AiJudge } from '../features/mlb/components/MlbIntelligenceHub/types';

import { 
  AURORA_ACTIVE, 
  AURORA_IDLE, 
  AURORA_LABEL, 
  AURORA_PAGE, 
  AURORA_PAGE_PAD_X, 
  AURORA_PAGE_PAD_Y, 
  AURORA_PANEL_PREMIUM, 
  AURORA_SECTION_HEADER, 
  AURORA_STAT_CHIP, 
  AURORA_SURFACE 
} from '../theme/auroraTokens';

const num = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const pct = (value: unknown) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n <= 1) return `${(n * 100).toFixed(1)}%`;
  return `${n.toFixed(1)}%`;
};

const cleanName = (c: any) => c.playerName || c.name || 'Unknown player';
const cleanOpponent = (c: any) => c.opponent || c.opponentTeam || 'TBD';
const cleanPitcher = (c: any) => c.opponentPitcherName || 'Pitcher TBD';
const safeArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

export default function MlbIntelligenceHubZ8({ onSectionChange }: Props) {
  const {
    selectedCandidate,
    setSelectedCandidate,
    selectedPlayerPayload,
    verdict,
    tab,
    setTab,
    report,
    loading,
    error,
    judgeBoard,
    judgeLoading,
    judgeError,
    load,
    loadJudges,
    candidates,
    topTargets,
    pitcherGroups,
    gameGroups,
    agents,
    agentRegistryQuery,
    handleCandidateSelect,
  } = useMlbIntelligenceHub();

  return (
    <main className={`${AURORA_PAGE} ${AURORA_PAGE_PAD_X} ${AURORA_PAGE_PAD_Y} min-h-0 min-w-0 text-ve-flash ve-safe-bottom`}>
      <div className={`mb-5 overflow-hidden relative ${AURORA_PANEL_PREMIUM} p-5`}>
        <div className="absolute -top-24 -right-24 h-60 w-60 rounded-full bg-vouch-cyan/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-vouch-emerald/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <HrBrandIcon />
            <div className="min-w-0">
              <p className={`mb-2 ${AURORA_LABEL} text-vouch-cyan`}>
                AI game room
              </p>
              <h1 className={AURORA_SECTION_HEADER}>
                The Vouch AI Edge Lab
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/55">
                The complete MLB intelligence workspace powered by the working HR Board engine. Research HR projections, pitcher pressure, game environments, player comparisons, source-backed graphs, and AI judge signals in one place.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {onSectionChange && (
              <button
                type="button"
                onClick={() => onSectionChange('hr_max')}
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-vouch-cyan/35 bg-vouch-cyan/10 px-4 py-3 text-sm font-black text-vouch-cyan hover:bg-vouch-cyan/15"
              >
                <HrBrandIcon size="sm" />
                Home Run Intelligence
              </button>
            )}
            <button
              onClick={load}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${AURORA_SURFACE} hover:border-vouch-cyan/40 hover:text-white text-white/80`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          <StatTile label="Date" value={<span className="text-base">{report?.date ?? '—'}</span>} />
          <StatTile label="Games" value={report?.gameCount ?? 0} tone="sky" />
          <StatTile label="Hitters" value={candidates.length} tone="emerald" />
          <StatTile label="Data" value={<span className="text-base">{report?.dataQuality ?? 'loading'}</span>} tone="amber" />
        </div>

        <div className="relative mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {agents.map((agent) => (
            <div key={agent.code} className={`group rounded-2xl ${AURORA_PANEL_PREMIUM} p-3 hover:border-vouch-cyan/35 transition`}>
              <div className="flex items-center gap-3">
                <PixelAgentIcon code={agent.code} />
                <div>
                  <p className="text-sm font-black text-white">{agent.displayName}</p>
                  <p className={`${AURORA_LABEL} text-white/40`}>{agent.role ?? agent.specialty}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-white/50 leading-relaxed">{agent.focus ?? agent.persona}</p>
              <div className={`mt-3 inline-flex items-center rounded-full border border-vouch-cyan/20 bg-vouch-cyan/5 px-2 py-1 ${AURORA_LABEL} text-vouch-cyan`}>
                {agent.tagline}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`mb-5 rounded-2xl p-3 ${AURORA_PANEL_PREMIUM}`}>
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-vouch-cyan" />
          <p className="text-xs text-white/50">
            {report?.disclaimer ?? 'Research only — not betting advice. No guaranteed outcomes.'}
          </p>
        </div>
        {error && <p className="mt-2 text-xs text-amber-300">Fallback mode: {error}</p>}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ['overview', 'Overview', Brain],
          ['targets', 'HR Targets', Target],
          ['pitchers', 'Pitcher Pressure', Activity],
          ['games', 'Game Environments', Zap],
          ['graphs', 'Pro Graphs', BarChart3],
          ['judges', 'Judge Leaderboard', Flame],
        ].map(([id, label, Icon]) => {
          const active = tab === id;
          const I = Icon as typeof Brain;
          return (
            <button
              key={String(id)}
              onClick={() => setTab(id as Tab)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
                active ? AURORA_ACTIVE : AURORA_IDLE
              }`}
            >
              <I className="h-4 w-4" />
              {String(label)}
            </button>
          );
        })}
      </div>

      {loading && tab !== 'judges' && tab !== 'graphs' && (
        <div className={`rounded-3xl ${AURORA_PANEL_PREMIUM} p-8 text-center text-white/50`}>
          Loading AI Edge Lab…
        </div>
      )}

      {!loading &&
        candidates.length === 0 &&
        tab !== 'judges' &&
        tab !== 'graphs' && (
        <div className={`rounded-3xl ${AURORA_PANEL_PREMIUM} p-8 text-center`}>
          <p className="text-lg font-black text-white">No intelligence rows available yet.</p>
          <p className="mt-2 text-sm text-white/50">
            The page is safe and no fake data is shown. Refresh once the HR Board endpoint returns candidates.
          </p>
        </div>
      )}

      {selectedCandidate && (
                  <section
          aria-label={`${cleanName(selectedCandidate)} research workspace`}
          className={`relative overflow-hidden rounded-[28px] ${AURORA_PANEL_PREMIUM}`}
        >
          <VerdictPanel verdict={verdict} />

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vouch-cyan/70 to-transparent" />

          <div className="flex items-start justify-between gap-4 border-b border-white/8 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <p className={`${AURORA_LABEL} text-vouch-cyan`}>
                Active player workspace
              </p>
              <h2 className="mt-1 truncate text-xl font-black text-white sm:text-2xl">
                {cleanName(selectedCandidate)}
              </h2>
              <p className="mt-1 text-xs text-white/45 sm:text-sm">
                AI decision, matchup context, source-backed signals and Pro Graphs — without leaving the Edge Lab.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCandidate(null)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              aria-label="Close player workspace"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] sm:p-6">
            <div className="space-y-4">
              {selectedPlayerPayload && (
                <PlayerResearchDecisionCard payload={selectedPlayerPayload} />
              )}

              <div className={`rounded-2xl p-4 ${AURORA_SURFACE}`}>
                <p className={`${AURORA_LABEL} text-white/40`}>
                  Matchup intelligence
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <StatTile
                    label="Opponent"
                    value={<span className="text-sm">{cleanOpponent(selectedCandidate)}</span>}
                  />
                  <StatTile
                    label="Pitcher"
                    value={<span className="text-sm">{cleanPitcher(selectedCandidate)}</span>}
                  />
                  <StatTile
                    label="HR edge"
                    value={num(selectedCandidate.hrScore)}
                    tone="sky"
                  />
                  <StatTile
                    label="Estimated HR"
                    value={pct(selectedCandidate.estimatedHrProbability)}
                    tone="emerald"
                  />
                </div>
              </div>

              {(selectedCandidate.reasons?.length ?? 0) > 0 && (
                <div className={`rounded-2xl p-4 ${AURORA_SURFACE}`}>
                  <p className={`${AURORA_LABEL} text-white/40`}>
                    AI evidence
                  </p>

                  <div className="mt-3 space-y-2">
                    {safeArray<string>(selectedCandidate.reasons)
                      .slice(0, 5)
                      .map((reason, index) => (
                        <div
                          key={`${reason}-${index}`}
                          className="flex gap-2 rounded-xl border border-white/6 bg-black/20 px-3 py-2 text-xs leading-relaxed text-white/70"
                        >
                          <span className="font-mono text-vouch-cyan">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span>{reason}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl border border-white/8 bg-black/20">
              <div className="border-b border-white/8 px-4 py-3">
                <p className={`${AURORA_LABEL} text-vouch-cyan`}>
                  Pro Graphs
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Advanced visual research remains inside the active player workspace.
                </p>
              </div>

              <ProGraphsLabPageZ8 embedded />
            </div>
          </div>
        </section>
      )}

      {!loading && candidates.length > 0 && tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
            {topTargets.slice(0, 6).map((c, i) => (
              <CandidateCard key={`${cleanName(c)}-${i}`} c={c} rank={i + 1} onSelect={handleCandidateSelect} />
            ))}
          </div>
          <div className="space-y-3">
            <div className={`rounded-3xl ${AURORA_PANEL_PREMIUM} p-4`}>
              <p className={`mb-3 ${AURORA_LABEL}`}>Pitcher pressure board</p>
              {pitcherGroups.slice(0, 6).map((p, i) => (
                <div key={p.pitcher} className={`mb-2 rounded-2xl p-3 ${AURORA_SURFACE}`}>
                  <p className="text-sm font-black text-slate-100">#{i + 1} {p.pitcher}</p>
                  <p className="text-xs text-slate-500">{p.threats} hitters · top HR edge {p.topScore} · {p.venue}</p>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className={`${AURORA_LABEL} text-amber-300`}>🔒 Pro Intel</p>
              <p className="mt-1 text-sm font-black text-white">RBI windows, stolen bases, bullpen fatigue, pitch mix, and live parlay impact.</p>
            </div>
          </div>
        </div>
      )}

      {!loading && candidates.length > 0 && tab === 'targets' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topTargets.map((c, i) => <CandidateCard key={`${cleanName(c)}-target-${i}`} c={c} rank={i + 1} onSelect={handleCandidateSelect} />)}
        </div>
      )}

      {!loading && candidates.length > 0 && tab === 'pitchers' && (
        <div className="grid gap-4 md:grid-cols-2">
          {pitcherGroups.map((p, i) => (
            <div key={p.pitcher} className={`rounded-3xl ${AURORA_PANEL_PREMIUM} p-4`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`${AURORA_LABEL} text-slate-500`}>#{i + 1} pressure target</p>
                  <h3 className={AURORA_SECTION_HEADER}>{p.pitcher}</h3>
                  <p className="text-xs text-slate-400">{p.venue}</p>
                </div>
                <StatTile label="Top edge" value={p.topScore} tone="amber" />
              </div>
              <div className="mt-3 grid gap-2">
                {p.rows.slice(0, 4).map((c, idx) => (
                  <div key={`${cleanName(c)}-${idx}`} className={`flex items-center justify-between rounded-2xl p-3 ${AURORA_SURFACE}`}>
                    <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-200">
                      <PlayerHeadshot name={cleanName(c)} playerId={c.playerId} headshotUrl={c.headshotUrl ?? c.headshot} size={32} />
                      <span className="truncate">{cleanName(c)}</span>
                    </span>
                    <span className="text-sm font-black text-vouch-cyan">{num(c.hrScore)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && candidates.length > 0 && tab === 'games' && (
        <div className="grid gap-4 md:grid-cols-2">
          {gameGroups.map((g, i) => (
            <div key={g.game} className={`rounded-3xl ${AURORA_PANEL_PREMIUM} p-4`}>
              <p className={`${AURORA_LABEL} text-slate-500`}>#{i + 1} run environment</p>
              <h3 className={AURORA_SECTION_HEADER}>{g.game}</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <StatTile label="Avg edge" value={g.avgScore} tone="sky" />
                <StatTile label="Threats" value={g.threats} tone="emerald" />
                <StatTile label="Hitters" value={g.rows.length} />
              </div>
            </div>
          ))}
        </div>
      )}


      {tab === 'graphs' && (
        <section className="min-w-0">
          <div className={`mb-4 rounded-3xl ${AURORA_PANEL_PREMIUM} p-5`}>
            <p className={`${AURORA_LABEL} text-vouch-cyan`}>
              Source-backed visual intelligence
            </p>
            <h2 className={AURORA_SECTION_HEADER}>Pro Graphs</h2>
            <p className="mt-2 max-w-3xl text-sm text-white/55">
              Explore HR signal spectra, player comparisons, team pressure,
              pitcher vulnerability, and matchup evidence without leaving
              The Vouch AI Edge Lab.
            </p>
          </div>

          <ProGraphsLabPageZ8 embedded />
        </section>
      )}

      {tab === 'judges' && (
        <section className="space-y-5">
          <div className={`rounded-3xl p-5 ${AURORA_PANEL_PREMIUM}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`${AURORA_LABEL} text-vouch-cyan`}>
                    Premium AI Judge Board
                  </p>
                  <span className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 ${AURORA_LABEL} text-white/45`}>
                    <Plug className="h-3 w-3 text-vouch-emerald/80" />
                    {agentRegistryQuery.data?.agents.length ?? 5} agent slots · extensible
                  </span>
                </div>
                <h2 className={AURORA_SECTION_HEADER}>AI Judge Leaderboard</h2>
                <p className="mt-2 max-w-3xl text-sm text-white/55">
                  Each AI judge posts one specialty-filtered single per day. Win rate and record come from graded singles in the picks ledger — honest W/L only, no fabricated stats.
                  Risk Auditor trap avoids win when the flagged player stays cold.
                </p>
              </div>
              <button
                onClick={loadJudges}
                className={`rounded-2xl px-4 py-2 text-sm font-black text-vouch-cyan transition ${AURORA_SURFACE} hover:border-vouch-cyan/30 hover:bg-vouch-cyan/10`}
              >
                Refresh Judges
              </button>
            </div>
          </div>

          <AgentDock
            agents={agentRegistryQuery.data?.agents ?? []}
            extensionDocs={agentRegistryQuery.data?.extensionDocs}
            loading={agentRegistryQuery.isLoading}
            error={
              agentRegistryQuery.isError
                ? agentRegistryQuery.error instanceof Error
                  ? agentRegistryQuery.error.message
                  : 'Agent registry unavailable.'
                : null
            }
          />

          {judgeLoading && (
            <div className={`rounded-3xl ${AURORA_PANEL_PREMIUM} p-6 text-white/70`}>
              Loading AI Judge leaderboard...
            </div>
          )}

          {judgeError && (
            <div className="rounded-3xl border border-red-400/30 bg-red-950/30 p-6 text-red-200">
              {judgeError}
            </div>
          )}

          {!judgeLoading && !judgeError && (
            <div className="space-y-5">
              {safeArray<AiJudge>(judgeBoard?.leaderboard).map((judge) => (
                <JudgeCard key={judge.id} judge={judge} />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
