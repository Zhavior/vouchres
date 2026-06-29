import React, { useState, useEffect } from 'react';
import {
  Activity, Flame, Search, CloudRain, Bot, AlertTriangle, ShieldCheck, RefreshCw, Gavel,
} from 'lucide-react';
import { vouchedgeApi } from '../api/vouchedgeApi';
import type { DailyMlbReport, VulnerablePitcher } from '../types/mlb';
import type { AgentPicksResponse, CapperAgent } from '../types/agents';
import type { CreatorProofProfile } from '../types';
import { hasTierAccess } from './pro/ProAccessGate';
import PitcherProfileDrawer from './intel/PitcherProfileDrawer';

type Tab = 'pitchers' | 'hr' | 'sneaky' | 'runs' | 'agents';

interface MlbIntelligenceHubProps {
  profile?: CreatorProofProfile;
  onSectionChange?: (section: string) => void;
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'pitchers', label: 'Vulnerable Pitchers', icon: Activity },
  { id: 'hr', label: 'HR Targets', icon: Flame },
  { id: 'sneaky', label: 'Sneaky HR', icon: Search },
  { id: 'runs', label: 'Run Environments', icon: CloudRain },
  { id: 'agents', label: 'AI Cappers', icon: Bot },
];

function scoreColor(score: number): string {
  if (score >= 75) return '#34d399'; // emerald
  if (score >= 58) return '#fbbf24'; // amber
  return '#f87171'; // red
}

function ScoreBar({ score }: { score: number }) {
  const c = scoreColor(score);
  return (
    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden w-full">
      <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: c, boxShadow: `0 0 8px ${c}` }} />
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded border uppercase tracking-wider"
      style={{ color, borderColor: color + '55', background: color + '14' }}>
      {text}
    </span>
  );
}

const RISK_COLOR: Record<string, string> = {
  LOW: '#34d399', MEDIUM: '#fbbf24', HIGH: '#fb923c', EXTREME: '#f87171',
  Safe: '#34d399', Balanced: '#22d3ee', Risky: '#fb923c', Sneaky: '#a78bfa', Lotto: '#f87171',
};

export default function MlbIntelligenceHub({ profile, onSectionChange }: MlbIntelligenceHubProps = {}) {
  const [report, setReport] = useState<DailyMlbReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('pitchers');
  const [selectedPitcher, setSelectedPitcher] = useState<VulnerablePitcher | null>(null);
  const isPro = profile ? hasTierAccess(profile, 'GOLD') : false;

  const [cappers, setCappers] = useState<CapperAgent[]>([]);
  const [activeAgent, setActiveAgent] = useState('hr-hunter');
  const [agentPicks, setAgentPicks] = useState<AgentPicksResponse | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vouchedgeApi.dailyReport();
      setReport(data);
    } catch {
      setError('Backend unavailable — run the dev server (npm run dev) to load live MLB intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    vouchedgeApi.agents().then((d) => setCappers(d.cappers)).catch(() => {});
  }, []);

  const loadAgentPicks = async (id: string) => {
    setActiveAgent(id);
    setAgentLoading(true);
    try {
      setAgentPicks(await vouchedgeApi.generatePicks(id));
    } catch {
      setAgentPicks(null);
    } finally {
      setAgentLoading(false);
    }
  };

  useEffect(() => { if (tab === 'agents' && !agentPicks) loadAgentPicks(activeAgent); }, [tab]); // eslint-disable-line

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 text-slate-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-black tracking-tight">MLB Intelligence Hub</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {report ? `${report.date} · ${report.gameCount} games · data: ${report.dataQuality}` : 'Loading live slate…'}
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Disclaimer */}
      <div className="mb-5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {report?.disclaimer ?? 'Probability-based research for entertainment — not betting advice. No guaranteed outcomes.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all ${active ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 text-center text-sm text-red-300">{error}</div>
      )}

      {loading && !report && (
        <div className="grid sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />)}
        </div>
      )}

      {report && !error && (
        <>
          {/* Vulnerable Pitchers */}
          {tab === 'pitchers' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {report.vulnerablePitchers.length === 0 && <Empty />}
              {report.vulnerablePitchers.map((p) => (
                <button
                  key={p.pitcherId}
                  type="button"
                  onClick={() => setSelectedPitcher(p)}
                  className="group p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-left transition-all hover:border-sky-500/40 hover:bg-slate-900"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold group-hover:text-sky-200">{p.pitcherName}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">{p.team} vs {p.opponent} · {p.throws}HP</p>
                    </div>
                    <Badge text={p.riskTier} color={RISK_COLOR[p.riskTier] ?? '#94a3b8'} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold" style={{ color: scoreColor(p.vulnerabilityScore) }}>{p.vulnerabilityScore}</span>
                    <ScoreBar score={p.vulnerabilityScore} />
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-0.5">
                    {p.attackReasons.slice(0, 2).map((r, i) => <li key={i}>• {r}</li>)}
                  </ul>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[10px] text-slate-600 font-mono">Markets: {p.recommendedMarkets.join(' · ')}</p>
                    <span className="text-[10px] font-bold text-sky-400 opacity-0 transition-opacity group-hover:opacity-100">View profile →</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* HR Targets */}
          {tab === 'hr' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {report.hrTargets.length === 0 && <Empty />}
              {report.hrTargets.map((t) => (
                <div key={t.targetId} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold">{t.team}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">vs {t.opposingPitcher} ({t.opponent})</p>
                    </div>
                    <Badge text={t.label} color={t.label === 'Strong' ? '#34d399' : t.label === 'Playable' ? '#22d3ee' : t.label === 'Sneaky' ? '#a78bfa' : '#f87171'} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold" style={{ color: scoreColor(t.hrScore) }}>{t.hrScore}</span>
                    <ScoreBar score={t.hrScore} />
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-0.5">
                    {t.reasons.slice(0, 2).map((r, i) => <li key={i}>• {r}</li>)}
                  </ul>
                  {t.riskWarnings[0] && <p className="text-[10px] text-amber-400/80 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t.riskWarnings[0]}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Sneaky HR */}
          {tab === 'sneaky' && (
            <div className="space-y-3">
              {report.sneakyHr.length === 0 && <Empty />}
              {report.sneakyHr.map((s) => (
                <div key={s.sneakyRank} className="p-4 rounded-2xl bg-slate-900/50 border border-violet-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold flex items-center gap-2"><span className="text-violet-400">#{s.sneakyRank}</span> {s.team} <span className="text-slate-500 font-normal text-xs">vs {s.opposingPitcher}</span></h3>
                    <Badge text={s.risk} color={RISK_COLOR[s.risk] ?? '#f87171'} />
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">{s.reason}</p>
                  <p className="text-[10px] text-amber-400/80 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {s.whatCouldGoWrong[0]}</p>
                </div>
              ))}
            </div>
          )}

          {/* Run Environments */}
          {tab === 'runs' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {report.runEnvironments.length === 0 && <Empty />}
              {report.runEnvironments.map((r) => (
                <div key={r.gamePk} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold font-mono">{r.matchup}</h3>
                    <Badge text={r.tier} color={r.tier === 'SHOOTOUT' ? '#f87171' : r.tier === 'HIGH' ? '#fb923c' : r.tier === 'MODERATE' ? '#fbbf24' : '#64748b'} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold" style={{ color: scoreColor(r.runEnvironmentScore) }}>{r.runEnvironmentScore}</span>
                    <ScoreBar score={r.runEnvironmentScore} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">Angles: {r.suggestedAngles.join(' · ')}</p>
                </div>
              ))}
            </div>
          )}

          {/* AI Cappers */}
          {tab === 'agents' && (
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {cappers.map((c) => (
                  <button key={c.id} onClick={() => loadAgentPicks(c.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${activeAgent === c.id ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
              {agentLoading && <div className="h-24 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />}
              {!agentLoading && agentPicks && (
                <div className="space-y-3">
                  {agentPicks.picks.length === 0 && <Empty label="No picks from this capper for today's slate." />}
                  {agentPicks.picks.map((jp, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <h3 className="text-sm font-bold">{jp.pick.selection}</h3>
                        <span className="text-xs font-mono font-bold flex-shrink-0" style={{ color: scoreColor(jp.verdict.finalScore) }}>{jp.verdict.finalScore}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge text={jp.verdict.approvalStatus} color={jp.verdict.approvalStatus === 'Approved' ? '#34d399' : jp.verdict.approvalStatus === 'Avoid' ? '#f87171' : '#fbbf24'} />
                        <Badge text={jp.verdict.riskLabel} color={RISK_COLOR[jp.verdict.riskLabel] ?? '#94a3b8'} />
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1"><Gavel className="w-3 h-3" /> 4-judge panel</span>
                      </div>
                      {jp.verdict.whatCouldGoWrong[0] && (
                        <p className="text-[10px] text-amber-400/80 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {jp.verdict.whatCouldGoWrong[0]}</p>
                      )}
                      {jp.verdict.saferAlternative && (
                        <p className="text-[10px] text-emerald-400/80 mt-1">↪ {jp.verdict.saferAlternative}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <PitcherProfileDrawer
        pitcher={selectedPitcher}
        isPro={isPro}
        onClose={() => setSelectedPitcher(null)}
        onUpgrade={() => { setSelectedPitcher(null); onSectionChange?.('premium'); }}
      />
    </div>
  );
}

function Empty({ label = 'No data for this report yet. The slate may be empty or the API is rate-limited.' }: { label?: string }) {
  return <div className="sm:col-span-2 p-8 text-center text-xs text-slate-500 font-mono rounded-2xl bg-slate-900/40 border border-slate-800">{label}</div>;
}
