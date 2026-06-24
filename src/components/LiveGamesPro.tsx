import React, { useState, useEffect, useCallback } from 'react';
import {
  Tv, RefreshCw, Flame, AlertTriangle, ChevronRight, X, Gavel, Activity, CloudSun, Plus, Radio,
} from 'lucide-react';
import { vouchedgeApi } from '../api/vouchedgeApi';
import type { GameMatchup, HrWatch } from '../types/matchup';
import type { MLBPlayer } from '../types';

interface Props {
  onSectionChange: (section: string) => void;
  onAddLegToParlay: (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => void;
}

const REFRESH_MS = 3 * 60_000;

function americanToDecimal(am: string): number {
  const n = parseInt(am, 10);
  if (isNaN(n)) return 2.0;
  return n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
}
function vulnColor(v: number): string {
  if (v >= 70) return '#f87171';
  if (v >= 55) return '#fbbf24';
  return '#34d399';
}
function gradeColor(g: string): string {
  return g === 'A+' || g === 'A' ? '#34d399' : g === 'B' ? '#22d3ee' : g === 'C' ? '#fbbf24' : '#f87171';
}
const FORM_COLOR: Record<string, string> = { Hot: '#fb7185', Average: '#94a3b8', Cold: '#60a5fa', Slump: '#64748b' };

function TeamLogo({ src, alt, size = 32 }: { src: string; alt: string; size?: number }) {
  return <img src={src} alt={alt} width={size} height={size} loading="lazy"
    className="object-contain shrink-0" style={{ width: size, height: size }}
    onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />;
}

function StatusBadge({ m }: { m: GameMatchup }) {
  if (m.isLive) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black font-mono uppercase text-red-400 px-2 py-0.5 rounded-full border border-red-500/40 bg-red-500/10">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
    </span>
  );
  if (m.isFinal) return <span className="text-[10px] font-black font-mono uppercase text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/50">Final</span>;
  const t = m.gameTime ? new Date(m.gameTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  return <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">{t}</span>;
}

const ENV_COLOR: Record<string, string> = { SHOOTOUT: '#f87171', HIGH: '#fb923c', MODERATE: '#fbbf24', LOW: '#64748b' };

const GameCard: React.FC<{ m: GameMatchup; onOpen: () => void }> = ({ m, onOpen }) => {
  const homeFav = m.winProbability.home >= m.winProbability.away;
  return (
    <button onClick={onOpen}
      className={`text-left rounded-2xl border p-4 transition-all hover:scale-[1.01] w-full ${m.isLive ? 'border-red-500/30 bg-gradient-to-br from-red-950/20 via-[#0b1120] to-[#0b1120] shadow-[0_0_24px_rgba(239,68,68,0.12)]' : 'border-slate-800 bg-gradient-to-br from-slate-900/40 to-[#0b1120]'}`}>
      <div className="flex items-center justify-between mb-3">
        <StatusBadge m={m} />
        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[55%]">{m.venue}</span>
      </div>

      {/* Teams */}
      {[m.away, m.home].map((t, i) => {
        const pct = i === 0 ? m.winProbability.away : m.winProbability.home;
        const fav = i === 0 ? !homeFav : homeFav;
        const score = i === 0 ? m.score.away : m.score.home;
        return (
          <div key={t.teamId} className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <TeamLogo src={t.logo} alt={t.name} />
              <div className="min-w-0">
                <p className={`text-sm font-black truncate ${fav ? 'text-slate-100' : 'text-slate-300'}`}>{t.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">{t.record ? `${t.record.wins}-${t.record.losses}` : '—'} · {pct}% win</p>
              </div>
            </div>
            <span className="text-xl font-mono font-black text-white">{(m.isLive || m.isFinal) ? score : ''}</span>
          </div>
        );
      })}

      {/* Win prob bar */}
      <div className="mt-1 h-1.5 rounded-full overflow-hidden bg-slate-800 flex">
        <div style={{ width: `${m.winProbability.away}%`, background: '#64748b' }} />
        <div style={{ width: `${m.winProbability.home}%`, background: '#0ea5e9' }} />
      </div>

      {/* Run env + top HR watch */}
      <div className="flex items-center justify-between mt-3">
        {m.runEnvironment && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ color: ENV_COLOR[m.runEnvironment.tier] ?? '#94a3b8', borderColor: (ENV_COLOR[m.runEnvironment.tier] ?? '#94a3b8') + '44' }}>
            🔥 {m.runEnvironment.tier} RUN ENV
          </span>
        )}
        <span className="flex items-center gap-1 text-[10px] text-sky-400 font-bold">AI Breakdown <ChevronRight className="w-3 h-3" /></span>
      </div>

      {m.topHrWatch.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/60">
          <span className="text-[9px] text-slate-500 font-mono uppercase mr-1">HR Watch</span>
          {m.topHrWatch.slice(0, 3).map((w) => (
            <span key={w.playerId} className="flex items-center gap-1">
              <img src={w.headshot} alt={w.playerName} loading="lazy" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover bg-slate-900 border border-slate-700" />
              <span className="text-[10px] text-slate-300 truncate max-w-[70px]">{w.playerName.split(' ').slice(-1)[0]}</span>
              <span className="text-[9px] font-mono font-bold" style={{ color: gradeColor(w.grade) }}>{w.hrEdge}</span>
            </span>
          ))}
        </div>
      )}
    </button>
  );
};

function MatchupDrawer({ m, onClose, onAddLeg }: { m: GameMatchup; onClose: () => void; onAddLeg: (w: HrWatch) => void }) {
  const Section: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; tone?: string; children: React.ReactNode }> = ({ icon: Icon, title, tone = '#38bdf8', children }) => (
    <div>
      <div className="flex items-center gap-1.5 mb-2"><Icon className="w-3.5 h-3.5" style={{ color: tone }} /><h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400">{title}</h4></div>
      {children}
    </div>
  );
  const homeFav = m.winProbability.home >= m.winProbability.away;
  return (
    <div className="fixed inset-0 z-[120] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg h-full bg-[#0b1120] border-l border-slate-800 overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0b1120]/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo src={m.away.logo} alt={m.away.name} size={26} />
            <span className="text-sm font-black text-slate-100">{m.away.abbreviation} @ {m.home.abbreviation}</span>
            <TeamLogo src={m.home.logo} alt={m.home.name} size={26} />
            <StatusBadge m={m} />
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-5">
          {/* Win probability */}
          <Section icon={Activity} title="Win probability (model)">
            <div className="flex items-center justify-between text-sm font-black mb-1.5">
              <span className={!homeFav ? 'text-sky-400' : 'text-slate-300'}>{m.away.abbreviation} {m.winProbability.away}%</span>
              <span className={homeFav ? 'text-sky-400' : 'text-slate-300'}>{m.winProbability.home}% {m.home.abbreviation}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-slate-800 flex mb-2">
              <div style={{ width: `${m.winProbability.away}%`, background: '#64748b' }} />
              <div style={{ width: `${m.winProbability.home}%`, background: '#0ea5e9' }} />
            </div>
            <ul className="space-y-0.5">{m.winProbModel.map((r, i) => <li key={i} className="text-[11px] text-slate-400">• {r}</li>)}</ul>
          </Section>

          {/* Pitcher matchups */}
          <Section icon={AlertTriangle} title="Starting pitcher matchups" tone="#fbbf24">
            <div className="grid grid-cols-2 gap-2">
              {[m.away, m.home].map((t) => (
                <div key={t.teamId} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <p className="text-[10px] text-slate-500 font-mono">{t.abbreviation}</p>
                  <p className="text-xs font-bold text-slate-200 truncate">{t.probablePitcher?.name ?? 'TBD'}</p>
                  {t.probablePitcher && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] text-slate-500 font-mono">VULN</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full" style={{ width: `${t.probablePitcher.vulnerability}%`, background: vulnColor(t.probablePitcher.vulnerability) }} /></div>
                      <span className="text-[10px] font-mono font-bold" style={{ color: vulnColor(t.probablePitcher.vulnerability) }}>{t.probablePitcher.vulnerability}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* Run environment */}
          {m.runEnvironment && (
            <Section icon={CloudSun} title="Run environment" tone="#34d399">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-black font-mono" style={{ color: ENV_COLOR[m.runEnvironment.tier] ?? '#94a3b8' }}>{m.runEnvironment.tier}</span>
                <span className="text-xs text-slate-400 font-mono">{m.runEnvironment.score}/100</span>
              </div>
              <ul className="space-y-0.5">{m.runEnvironment.reasons.map((r, i) => <li key={i} className="text-[11px] text-slate-400">• {r}</li>)}</ul>
            </Section>
          )}

          {/* Players to watch */}
          <Section icon={Flame} title="Players to watch (HR)" tone="#fb923c">
            <div className="space-y-2">
              {m.topHrWatch.map((w) => (
                <div key={w.playerId} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
                  <img src={w.headshot} alt={w.playerName} loading="lazy" referrerPolicy="no-referrer" className="w-9 h-9 rounded-lg object-cover bg-slate-900 border border-slate-800 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-100 truncate flex items-center gap-1.5">
                      {w.playerName}
                      <span className="text-[9px] font-black font-mono px-1 rounded" style={{ color: gradeColor(w.grade), background: gradeColor(w.grade) + '20' }}>{w.grade}</span>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: FORM_COLOR[w.formTag] ?? '#94a3b8' }} />
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{w.team} · HR edge {w.hrEdge} · {w.impliedOdds} · vs {w.opposingPitcher}</p>
                  </div>
                  <button onClick={() => onAddLeg(w)} className="flex items-center gap-1 text-[10px] font-bold text-sky-400 border border-sky-500/40 rounded-lg px-2 py-1 hover:bg-sky-500/10 flex-shrink-0">
                    <Plus className="w-3 h-3" /> Slip
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* Key factors + what to watch */}
          <Section icon={Gavel} title="Key factors & what to watch">
            <ul className="space-y-1">
              {[...m.keyFactors, ...m.whatToWatch].map((f, i) => <li key={i} className="text-[11px] text-slate-300">• {f}</li>)}
            </ul>
          </Section>

          {/* AI verdict */}
          <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20">
            <p className="text-[10px] font-black font-mono uppercase tracking-wider text-sky-400 mb-1">VouchEdge AI Verdict</p>
            <p className="text-xs text-slate-300 leading-relaxed">{m.aiVerdict}</p>
          </div>

          <p className="text-[10px] text-slate-600 text-center">Probability-based research for entertainment — not betting advice. Lineups/weather are projected placeholders.</p>
        </div>
      </div>
    </div>
  );
}

export default function LiveGamesPro({ onSectionChange, onAddLegToParlay }: Props) {
  const [matchups, setMatchups] = useState<GameMatchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveOnly, setLiveOnly] = useState(false);
  const [selected, setSelected] = useState<GameMatchup | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await vouchedgeApi.matchupsToday();
      setMatchups(res.matchups);
    } catch {
      setError('Backend unavailable — run the dev server to load live matchups.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const id = setInterval(load, REFRESH_MS); return () => clearInterval(id); }, [load]);

  const liveCount = matchups.filter((m) => m.isLive).length;
  const shown = liveOnly ? matchups.filter((m) => m.isLive) : matchups;

  const addLeg = (w: HrWatch) => {
    onAddLegToParlay({ name: w.playerName, team: w.team } as MLBPlayer, {
      id: `hrwatch-${w.playerId}`,
      market: 'Anytime HR',
      odds: americanToDecimal(w.impliedOdds),
      spec: `${w.playerName} Anytime HR`,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-5 text-slate-100">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-sky-950/30 via-[#0b1120] to-[#0b1120] p-5 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2"><Tv className="w-6 h-6 text-sky-400" /> Live Matchups</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-md">Real MLB schedule with model win probabilities, run environment, and the actual hitters to watch in each game.</p>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-sky-500/50 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => setLiveOnly(false)} className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${!liveOnly ? 'bg-sky-500/15 border-sky-500/50 text-sky-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>All games ({matchups.length})</button>
          <button onClick={() => setLiveOnly(true)} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${liveOnly ? 'bg-red-500/15 border-red-500/50 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
            <Radio className="w-3.5 h-3.5" /> Live only ({liveCount})
          </button>
        </div>
      </div>

      {error && <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 text-center text-sm text-red-300">{error}</div>}

      {loading && matchups.length === 0 && (
        <div className="grid sm:grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-52 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />)}</div>
      )}

      {!error && matchups.length > 0 && (
        shown.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 font-mono rounded-2xl bg-slate-900/40 border border-slate-800">No live games right now. Switch to “All games”.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {shown.map((m) => <GameCard key={m.gamePk} m={m} onOpen={() => setSelected(m)} />)}
          </div>
        )
      )}

      {selected && <MatchupDrawer m={selected} onClose={() => setSelected(null)} onAddLeg={addLeg} />}
    </div>
  );
}
