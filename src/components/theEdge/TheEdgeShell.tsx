import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Bot,
  Home,
  Layers3,
  LogIn,
  Palette,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import '../edgePortal/edgePortalTheme.css';
import { safeJsonFetch } from '../../api/safeApiClient';
import type { Parlay, CreatorProofProfile } from '../../types';

type TheEdgeMode = 'public' | 'dashboard';
type TheEdgePresentation = 'page' | 'overlay';

/** Trimmed funnel: one sell screen, one auth screen each, quick handoff to the Island. */
type EdgeLayer = 'intro' | 'login' | 'signup' | 'welcomeBack' | 'dashboard';

type TheEdgeShellProps = {
  mode: TheEdgeMode;
  presentation: TheEdgePresentation;
  activeSection?: string;
  slateLabel?: string;
  savedParlays?: Parlay[];
  profile?: Pick<CreatorProofProfile, 'displayName' | 'winRate' | 'totalPicks' | 'wonPicks'>;
  onClose?: () => void;
  onSectionChange: (section: string) => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

interface SlateGame {
  away: string;
  home: string;
  time: string;
  live: boolean;
}

/* ── small shared primitives (one accent: cyan; emerald=proof, rose=loss, amber=live) ── */

function Stat({ label, value, tone = 'white' }: { label: string; value: string | number; tone?: 'white' | 'cyan' | 'emerald' | 'rose' }) {
  const color = tone === 'cyan' ? 'text-cyan-300' : tone === 'emerald' ? 'text-emerald-300' : tone === 'rose' ? 'text-rose-300' : 'text-white';
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-center">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</div>
    </div>
  );
}

const PRIMARY = 'rounded-2xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5';
const SECONDARY = 'rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5';
const GHOST = 'rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-3.5 text-sm font-black text-slate-200 transition hover:-translate-y-0.5 hover:text-white';

export default function TheEdgeShell({
  mode,
  presentation,
  savedParlays = [],
  profile,
  onClose,
  onSectionChange,
}: TheEdgeShellProps) {
  const [edgeLayer, setEdgeLayer] = useState<EdgeLayer>(mode === 'public' ? 'intro' : 'welcomeBack');
  const [trial, setTrial] = useState(true);
  const [slate, setSlate] = useState<SlateGame[]>([]);

  // Real today's slate for the scoreboard ticker (no fake games).
  useEffect(() => {
    let alive = true;
    safeJsonFetch<any>('/api/mlb/lineup/today', { fallbackData: { games: [] }, timeoutMs: 12000 }).then((r) => {
      if (!alive) return;
      const games: SlateGame[] = (r.data?.games ?? []).slice(0, 12).map((g: any) => ({
        away: g.awayTeam?.abbrev ?? g.awayTeam?.name ?? 'AWY',
        home: g.homeTeam?.abbrev ?? g.homeTeam?.name ?? 'HOM',
        time: g.gameDate ? new Date(g.gameDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
        live: /progress|live|in play/i.test(String(g.status ?? '')),
      }));
      setSlate(games);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (mode === 'dashboard') {
      setEdgeLayer('welcomeBack');
      const t = window.setTimeout(() => setEdgeLayer('dashboard'), 900);
      return () => window.clearTimeout(t);
    }
  }, [mode]);

  // ── Real proof numbers (no placeholders) ──
  const stats = useMemo(() => {
    const saved = savedParlays.length;
    const pending = savedParlays.filter((p) => p.status === 'PENDING').length;
    const won = savedParlays.filter((p) => p.status === 'WON').length;
    const lost = savedParlays.filter((p) => p.status === 'LOST').length;
    const settled = won + lost;
    const slipWinRate = settled > 0 ? Math.round((won / settled) * 100) : null;
    const winRate = slipWinRate ?? (profile && profile.totalPicks > 0 ? Math.round(profile.winRate) : null);
    const liveNow = slate.filter((g) => g.live).length;
    return { saved, pending, won, lost, settled, winRate, gamesToday: slate.length, liveNow };
  }, [savedParlays, profile, slate]);

  function enterSite(section = 'feed') {
    onSectionChange(section);
    if (presentation === 'overlay') onClose?.();
  }

  function completeAuth() {
    localStorage.setItem('vouchedge_after_auth_mode', 'island');
    setEdgeLayer('welcomeBack');
    window.setTimeout(() => setEdgeLayer('dashboard'), 900);
  }

  const shellClass =
    presentation === 'page'
      ? 'min-h-screen overflow-hidden bg-slate-950 text-white'
      : 'relative mx-auto flex h-[92vh] max-w-7xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl shadow-black/60';

  const isAuthLayer = edgeLayer === 'login' || edgeLayer === 'signup';

  return (
    <motion.main
      className={`ve-theme-root ${shellClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      {/* Calm, single-accent backdrop — no rainbow */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 15% -10%, rgba(34,211,238,.16), transparent 40%), linear-gradient(180deg,#020617,#060b18 55%,#020617)' }} />
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(148,163,184,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.6)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* Compact top bar (single hero lives in the layer, not duplicated here) */}
        <header className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-sm font-black tracking-tight text-white">
              The <span className="text-cyan-300">Edge</span>
            </span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:inline">
              · {edgeLayer === 'dashboard' || edgeLayer === 'welcomeBack' ? 'The Island' : 'MLB Proof Engine'}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isAuthLayer && (
              <button onClick={() => setEdgeLayer('intro')} className="rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs font-black text-slate-300 transition hover:text-white">
                Back
              </button>
            )}
            {(edgeLayer === 'dashboard' || edgeLayer === 'welcomeBack') && (
              <button onClick={() => enterSite('feed')} className="rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5">
                Enter VouchEdge Site
              </button>
            )}
            {presentation === 'overlay' && (
              <button onClick={onClose} className="rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-slate-300 transition hover:text-white">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </header>

        <div className={presentation === 'page' ? 'flex-1 overflow-y-auto p-4 sm:p-8' : 'min-h-0 flex-1 overflow-y-auto p-4 sm:p-6'}>
          <AnimatePresence mode="wait">

            {/* ── INTRO: one sports-native sell screen (video + welcome merged) ── */}
            {edgeLayer === 'intro' && (
              <motion.section
                key="intro"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease }}
                className="mx-auto max-w-6xl"
              >
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                  {/* Left: the pitch */}
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" /> Proof before hype
                    </div>

                    <h1 className="mt-5 text-5xl font-black leading-[0.98] tracking-tight text-white sm:text-7xl">
                      The sharpest seat<br />in <span className="text-cyan-300">sports research.</span>
                    </h1>

                    <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
                      VouchEdge tracks every pick to the final box score. Research the slate, build parlays,
                      and follow members by receipts — not hype.
                    </p>

                    {/* Real proof strip */}
                    <div className="mt-6 grid max-w-md grid-cols-3 gap-2">
                      <Stat label="Games today" value={stats.gamesToday || '—'} tone="cyan" />
                      <Stat label="Live now" value={stats.liveNow} tone={stats.liveNow > 0 ? 'rose' : 'white'} />
                      <Stat label="Tracked to final" value="100%" tone="emerald" />
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <button onClick={() => { setTrial(true); setEdgeLayer('signup'); }} className={PRIMARY}>
                        <span className="inline-flex items-center gap-2">Start 2-week trial <ArrowRight className="h-4 w-4" /></span>
                      </button>
                      <button onClick={() => setEdgeLayer('login')} className={SECONDARY}>
                        <span className="inline-flex items-center gap-2"><LogIn className="h-4 w-4" /> Login</span>
                      </button>
                      <button onClick={() => enterSite('feed')} className={GHOST}>Explore site</button>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-bold text-slate-500">
                      <span>2-week trial</span><span>·</span><span>Cancel anytime</span><span>·</span><span>Research & entertainment only</span>
                    </div>
                  </div>

                  {/* Right: live scoreboard (real slate) — replaces the fake code panel */}
                  <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                      <div className="flex items-center gap-2 text-xs font-black text-white">
                        <Radio className="h-4 w-4 text-cyan-300" /> Today’s MLB slate
                      </div>
                      <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-400">{slate.length} games</span>
                    </div>
                    <div className="max-h-[420px] divide-y divide-slate-800/60 overflow-y-auto">
                      {slate.length === 0 ? (
                        <div className="px-4 py-10 text-center text-xs text-slate-500">Loading today’s verified slate…</div>
                      ) : (
                        slate.map((g, i) => (
                          <motion.div
                            key={`${g.away}-${g.home}-${i}`}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.3 }}
                            className="flex items-center justify-between px-4 py-2.5"
                          >
                            <div className="flex items-center gap-2 font-mono text-sm font-black text-slate-200">
                              <span className="w-10">{g.away}</span>
                              <span className="text-slate-600">@</span>
                              <span className="w-10">{g.home}</span>
                            </div>
                            {g.live ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-300">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> Live
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-500">{g.time}</span>
                            )}
                          </motion.div>
                        ))
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-px border-t border-slate-800 bg-slate-800/40 text-center">
                      {[['Proof', ShieldCheck], ['Research', TrendingUp], ['Community', Users]].map(([label, Icon]) => {
                        const I = Icon as typeof ShieldCheck;
                        return (
                          <div key={label as string} className="bg-slate-950/80 px-2 py-3">
                            <I className="mx-auto h-4 w-4 text-cyan-300" />
                            <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{label as string}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {/* ── LOGIN ── */}
            {edgeLayer === 'login' && (
              <motion.section
                key="login"
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.4, ease }}
                className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl shadow-black/30"
              >
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Login</div>
                <h2 className="mt-2 text-3xl font-black text-white">Welcome back.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">Login happens right here — then The Edge becomes your Island.</p>
                <div className="mt-6 grid gap-3">
                  <input className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" placeholder="Email" />
                  <input className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" placeholder="Password" type="password" />
                </div>
                <button onClick={completeAuth} className={`mt-6 w-full ${PRIMARY}`}>Login → Enter The Island</button>
                <button onClick={() => setEdgeLayer('signup')} className="mt-3 w-full text-center text-xs font-bold text-slate-500 hover:text-slate-300">
                  New here? Start a free trial →
                </button>
              </motion.section>
            )}

            {/* ── SIGNUP: details + trial choice on ONE screen ── */}
            {edgeLayer === 'signup' && (
              <motion.section
                key="signup"
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.4, ease }}
                className="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl shadow-black/30"
              >
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Create account</div>
                <h2 className="mt-2 text-3xl font-black text-white">Start your Edge.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">One step. Save picks, build a proof ledger, unlock the Island.</p>

                <div className="mt-6 grid gap-3">
                  <input className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" placeholder="Name" />
                  <input className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" placeholder="Email" />
                  <input className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" placeholder="Password" type="password" />
                </div>

                {/* Trial toggle (replaces a whole membership layer) */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTrial(true)}
                    className={`rounded-2xl border p-3 text-left transition ${trial ? 'border-emerald-300/40 bg-emerald-300/10' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'}`}
                  >
                    <div className="text-sm font-black text-white">2-week trial</div>
                    <div className="text-[11px] text-slate-400">Premium tools · cancel anytime</div>
                  </button>
                  <button
                    onClick={() => setTrial(false)}
                    className={`rounded-2xl border p-3 text-left transition ${!trial ? 'border-cyan-300/40 bg-cyan-300/10' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'}`}
                  >
                    <div className="text-sm font-black text-white">Continue free</div>
                    <div className="text-[11px] text-slate-400">Core features · upgrade later</div>
                  </button>
                </div>

                <button onClick={completeAuth} className={`mt-5 w-full ${PRIMARY}`}>
                  {trial ? 'Start trial → Enter The Island' : 'Create account → Enter The Island'}
                </button>
                <p className="mt-3 text-center text-[11px] text-slate-500">
                  If VouchEdge helps your research, keep a membership to support the platform.
                </p>
              </motion.section>
            )}

            {/* ── WELCOME BACK ── */}
            {edgeLayer === 'welcomeBack' && (
              <motion.section
                key="welcomeBack"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5, ease }}
                className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/70 p-10 text-center"
              >
                <motion.div
                  className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-300"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="h-8 w-8" />
                </motion.div>
                <h2 className="mt-5 text-4xl font-black text-white">
                  Welcome{profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ' back'}.
                </h2>
                <p className="mt-3 text-sm text-slate-400">Building your Island dashboard…</p>
              </motion.section>
            )}

            {/* ── ISLAND DASHBOARD (real data) ── */}
            {edgeLayer === 'dashboard' && (
              <motion.section
                key="dashboard"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease }}
                className="mx-auto max-w-6xl space-y-4"
              >
                <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">The Island</div>
                      <h2 className="mt-1.5 text-3xl font-black text-white sm:text-4xl">
                        Welcome back{profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}.
                      </h2>
                      <p className="mt-1.5 max-w-2xl text-sm text-slate-400">Your command island — real numbers, quick jumps into the site.</p>
                    </div>
                    <button onClick={() => enterSite('feed')} className={PRIMARY}>
                      <span className="inline-flex items-center gap-2"><Home className="h-4 w-4" /> Enter VouchEdge Site</span>
                    </button>
                  </div>

                  {/* Real widgets */}
                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Stat label="Saved parlays" value={stats.saved} tone="cyan" />
                    <Stat label="Pending" value={stats.pending} tone="white" />
                    <Stat label="Win rate" value={stats.winRate != null ? `${stats.winRate}%` : '—'} tone="emerald" />
                    <Stat label="Record" value={stats.settled > 0 ? `${stats.won}-${stats.lost}` : '0-0'} tone={stats.won >= stats.lost ? 'emerald' : 'rose'} />
                  </div>
                </section>

                {/* Quick jumps — routes verified against App.tsx */}
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {([
                    ['Today’s Board', 'today', TrendingUp],
                    ['Live Parlays', 'live_parlays', Radio],
                    ['Parlay Lab', 'build', Layers3],
                    ['Results Ledger', 'results', Trophy],
                  ] as const).map(([label, section, Icon]) => (
                    <button
                      key={label}
                      onClick={() => enterSite(section)}
                      className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-slate-900"
                    >
                      <Icon className="h-5 w-5 text-cyan-300" />
                      <div className="mt-3 text-sm font-black text-white">{label}</div>
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 opacity-0 transition group-hover:opacity-100">
                        Open <ArrowRight className="h-3 w-3" />
                      </div>
                    </button>
                  ))}
                </section>

                <section className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                    <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-cyan-300" /><h3 className="text-sm font-black text-white">Pending picks</h3></div>
                    <div className="mt-4 space-y-2">
                      {savedParlays.filter((p) => p.status === 'PENDING').slice(0, 4).map((p) => (
                        <button key={p.id} onClick={() => enterSite('live_parlays')} className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-left hover:border-cyan-300/30">
                          <span className="truncate text-xs font-bold text-slate-200">{p.title || 'Saved parlay'}</span>
                          <span className="font-mono text-[11px] text-cyan-300">{p.totalOdds}</span>
                        </button>
                      ))}
                      {stats.pending === 0 && (
                        <button onClick={() => enterSite('ai_engine')} className="w-full rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-3 py-4 text-center text-xs font-bold text-slate-500 hover:text-slate-300">
                          No pending picks — build one in V.A.I Smart Picks →
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                    <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-cyan-300" /><h3 className="text-sm font-black text-white">AI Seat</h3></div>
                    <div className="mt-4 grid gap-2">
                      {['Explain today’s board', 'Compare players', 'Build parlay logic'].map((tool) => (
                        <button key={tool} onClick={() => enterSite('ai_engine')} className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-left text-xs font-bold text-slate-200 hover:border-cyan-300/30">
                          {tool}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => enterSite('themestore')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200">
                      <Palette className="h-4 w-4 text-cyan-300" /> Theme Studio
                    </button>
                  </div>
                </section>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.main>
  );
}
