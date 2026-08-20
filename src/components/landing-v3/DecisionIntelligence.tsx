import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Cpu,
  FileSpreadsheet,
  GitCommit,
  History,
  Layers,
  Lock,
  Radio,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  XOctagon,
  Zap,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import './evidence-integrity-journey.css';

export interface DecisionIntelligenceProps {
  onJoinBeta?: () => void;
}

type ProtocolPhase = 1 | 2 | 3 | 4;
type SlateDay = 1 | 2 | 3 | 4 | 5;
type LockPhase = 1 | 2 | 3;
type BlueprintMode = 'ground_truth' | 'horizon_labs';

const protocolPhases = [
  {
    id: 1 as ProtocolPhase,
    label: 'AMNESIA DIFF',
    eyebrow: '04.1 // BIAS ELIMINATION',
    title: 'The cost of forgetting losses.',
    body: 'Most sports analysts suffer from selective amnesia. Three-day heaters get tweeted in all caps; brutal slates get deleted from the feed. VouchEdge forces every loss to be audited with the exact same mathematical weight as wins because every slate must teach the next one.',
    receipt: 'HIGHLIGHT REEL AMNESIA DEFEATED · 08 LEARN AUDIT TRAIL',
  },
  {
    id: 2 as ProtocolPhase,
    label: 'TRUTH OF NULL',
    eyebrow: '04.2 // RADICAL TRANSPARENCY',
    title: 'Missing data is a feature, not a bug.',
    body: 'Mainstream platforms hate admitting ignorance—they interpolate guesses and hallucinate fake confidence scores to look smart. When an MLB weather sensor fails or a bullpen layer is unverified, VouchEdge stamps it explicitly as UNAVAILABLE. Knowing what you do not know is the real edge.',
    receipt: 'ZERO SYNTHETIC HALLUCINATION · EXPLICIT NULL STATE STAMP',
  },
  {
    id: 3 as ProtocolPhase,
    label: 'CRYPTO TIME-LOCK',
    eyebrow: '04.3 // IMMUTABLE ACCOUNTABILITY',
    title: 'Reasoning sealed before first pitch.',
    body: 'Hindsight bias is undefeated in sports discourse. When you log an HR index, context matrix, and rationale at 1:00 PM, that record is locked before the first pitch. When the game goes final, reality meets your thesis—unaltered, unedited, and permanently recorded.',
    receipt: 'SHA-256 TIME-STAMPED RECORD · ZERO RETROACTIVE EDITS',
  },
  {
    id: 4 as ProtocolPhase,
    label: 'SYSTEM TOPOLOGY',
    eyebrow: '04.4 // METHODOLOGY BENCHMARK',
    title: 'Ground truth today. Radical vision ahead.',
    body: 'We separate what researchers can test right now in the free open beta from the experimental modules undergoing lab calibration. No paywalls, no credit cards required, zero subscription funnels.',
    receipt: 'OPEN BETA $0 ACCESS · 8-STEP PIPELINE ACTIVE · NO FUNNEL',
  },
] as const;

export default function DecisionIntelligence({ onJoinBeta }: DecisionIntelligenceProps) {
  const trackRef = useRef<HTMLElement>(null);
  const activeRef = useRef<ProtocolPhase>(1);
  const [active, setActive] = useState<ProtocolPhase>(1);
  const reduceMotion = useReducedMotion();

  // Scroll tracking for Pinned Scrollytelling Journey
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (typeof window === 'undefined' || window.matchMedia('(max-width: 767px)').matches) return;
    const next = Math.min(4, Math.floor(Math.min(0.999, Math.max(0, progress)) * 4) + 1) as ProtocolPhase;
    if (next !== activeRef.current) {
      activeRef.current = next;
      setActive(next);
    }
  });

  const goToPhase = useCallback((phase: ProtocolPhase) => {
    const track = trackRef.current;
    if (!track) return;
    activeRef.current = phase;
    setActive(phase);
    const start = track.getBoundingClientRect().top + window.scrollY;
    const usable = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: start + usable * ((phase - 1) / 3), behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [reduceMotion]);

  // Interactive Simulator States
  const [selectedDay, setSelectedDay] = useState<SlateDay>(2); // Default to loss day
  const [feedFailureActive, setFeedFailureActive] = useState<boolean>(true); // Default to failure to show power of NULL
  const [lockPhase, setLockPhase] = useState<LockPhase>(2); // Default to locked state
  const [blueprintMode, setBlueprintMode] = useState<BlueprintMode>('ground_truth');

  const slateDays = [
    { day: 1 as SlateDay, label: 'MON / G1', outcome: 'WIN', pick: 'NYY -1.5', score: '8-2 W' },
    { day: 2 as SlateDay, label: 'TUE / G2', outcome: 'LOSS', pick: 'LAD O8.5', score: '3-1 L' },
    { day: 3 as SlateDay, label: 'WED / G3', outcome: 'LOSS', pick: 'BAL ML', score: '2-4 L' },
    { day: 4 as SlateDay, label: 'THU / G4', outcome: 'WIN', pick: 'HOU -1.5', score: '7-1 W' },
    { day: 5 as SlateDay, label: 'FRI / G5', outcome: 'WIN', pick: 'ATL O9.0', score: '10-4 W' },
  ];

  const contrastRows = [
    {
      aspect: 'Accountability',
      tout: 'Scrubs losing tickets; tweets winners in ALL-CAPS',
      vouch: 'Time-stamped pre-pitch thesis locks; zero retroactive edits',
    },
    {
      aspect: 'Loss Handling',
      tout: 'Blamed on "bad beats" or swept into the memory hole',
      vouch: 'Systematic post-game variance audit via 08 LEARN workflow',
    },
    {
      aspect: 'Missing Data',
      tout: 'Synthesized or masked behind fake 99% confidence meters',
      vouch: 'Explicitly stamped as UNAVAILABLE or PARTIAL',
    },
    {
      aspect: 'Methodology',
      tout: '"My gut VIP lock of the century / 5-star unit bomb"',
      vouch: 'Statcast metrics + Pitcher Vulnerability + Environmental Matrix',
    },
    {
      aspect: 'Business Model',
      tout: '$99/mo subscription funnels promising guaranteed ROI',
      vouch: '$0 Open Beta building a network of analytical thinkers',
    },
  ];

  const liveFeatures = [
    {
      title: 'The 8-Step Research Pipeline',
      desc: 'Full interactive pre-game workflow from locating slates to locking pre-pitch theses (01 LOCATE through 08 LEARN).',
      tag: 'ACTIVE IN BETA',
      icon: Layers,
    },
    {
      title: 'Evidence State Transparency',
      desc: 'Real-time data parsing that tags metrics as AVAILABLE, PARTIAL, or UNAVAILABLE before you commit to a thesis.',
      tag: 'ACTIVE IN BETA',
      icon: Activity,
    },
    {
      title: 'Immutable Thesis Locking',
      desc: 'Time-stamped decision history that preserves your original context, confidence, and rationale before first pitch.',
      tag: 'ACTIVE IN BETA',
      icon: Lock,
    },
    {
      title: 'Post-Game Reality Reconciliation',
      desc: 'Automatically matching locked decisions against final MLB box scores to calculate true model variance.',
      tag: 'ACTIVE IN BETA',
      icon: GitCommit,
    },
  ];

  const horizonFeatures = [
    {
      title: 'Advanced Bullpen Strain Layer',
      desc: 'Deep tactical tracking for late-inning reliever leverage, short-rest fatigue, and batter-vs-bullpen splits.',
      tag: 'IN DEVELOPMENT',
      icon: Cpu,
    },
    {
      title: 'Community Consensus Truth Feeds',
      desc: 'Aggregated signal tracking where you can filter researchers by verified methodology accuracy rather than follower count.',
      tag: 'IN DEVELOPMENT',
      icon: Radio,
    },
    {
      title: 'Automated Export & Backtesting Loops',
      desc: 'One-click telemetry exports (CSV/JSON/Parquet) for building custom quantitative models and personal backtesting outside the app.',
      tag: 'IN DEVELOPMENT',
      icon: FileSpreadsheet,
    },
    {
      title: 'Dynamic Park Microclimate Telemetry',
      desc: 'Live barometric pressure, elevation-adjusted air density, and real-time roof status impact modeling.',
      tag: 'IN DEVELOPMENT',
      icon: Zap,
    },
  ];

  const currentPhase = protocolPhases[active - 1];

  return (
    <section
      ref={trackRef}
      id="decision-intelligence"
      className="ve-protocolJourney bg-black"
      aria-label="VouchEdge Anti-Pick-Peddler Protocol and Methodology"
    >
      <div className="ve-protocolJourney__pin">
        {/* TOP TELEMETRY HUD BAR */}
        <header className="ve-protocolJourney__hud">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-cyan-400 animate-pulse" />
            <span className="text-white font-bold tracking-widest">VOUCHEDGE // PROTOCOL INSPECTOR</span>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="text-cyan-300 font-bold hidden sm:inline">STAGE 0{active} / 04</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">ENGINE: <strong className="text-emerald-400 font-mono">DETERMINISTIC_LEDGER</strong></span>
            <span className="border border-cyan-400/40 bg-cyan-950/40 px-2 py-0.5 font-mono text-[8px] font-bold text-cyan-300 uppercase">
              SCROLLING STORY ACTIVE
            </span>
          </div>
        </header>

        {/* MAIN SPLIT-PANE WORKSPACE */}
        <div className="ve-protocolJourney__frame">
          
          {/* LEFT STORY PANE */}
          <aside className="ve-protocolJourney__story">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="will-change-[transform,opacity]"
              >
                <span className="ve-protocolJourney__eyebrow">{currentPhase.eyebrow}</span>
                <strong className="ve-protocolJourney__phase">{currentPhase.label}</strong>
                <h2>{currentPhase.title}</h2>
                <p>{currentPhase.body}</p>
              </motion.div>
            </AnimatePresence>

            {/* 4-PHASE NAVIGATOR RAIL */}
            <ol className="ve-protocolJourney__rail">
              {protocolPhases.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={active === item.id}
                    className={active === item.id ? 'is-active' : active > item.id ? 'is-passed' : ''}
                    onClick={() => goToPhase(item.id)}
                  >
                    <span>0{item.id}</span>
                    <strong>{item.label}</strong>
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          {/* RIGHT TACTICAL SIMULATOR WORLD */}
          <div className="ve-protocolJourney__world">
            <div className="ve-protocolJourney__worldHead">
              <span>ONE PROTOCOL / ZERO RETROACTIVE SPIN</span>
              <span>SIMULATION: STAGE 0{active}</span>
            </div>

            <div className="ve-protocolJourney__stage">
              <AnimatePresence mode="wait">
                
                {/* PHASE 1: THE AMNESIA DIFF */}
                {active === 1 && (
                  <motion.div
                    key="stage-1"
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="h-full flex flex-col justify-between gap-4 sm:gap-5 font-mono"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block">
                          PROTOCOL SIMULATOR // 01: THE AMNESIA DIFF
                        </span>
                        <strong className="text-white text-base sm:text-lg block mt-0.5">
                          Scrub the 5-Day Slate: Notice What Disappears
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-zinc-500 text-xs">SLATE:</span>
                        {slateDays.map((d) => (
                          <button
                            key={d.day}
                            type="button"
                            onClick={() => setSelectedDay(d.day)}
                            className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                              selectedDay === d.day
                                ? 'border-white bg-white text-black'
                                : d.outcome === 'LOSS'
                                ? 'border-red-900/60 bg-red-950/20 text-red-300 hover:border-red-500'
                                : 'border-emerald-900/60 bg-emerald-950/20 text-emerald-300 hover:border-emerald-500'
                            }`}
                          >
                            D{d.day} {d.outcome === 'LOSS' ? '❌' : '✓'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:gap-5 md:grid-cols-2 flex-1">
                      {/* Tout Side */}
                      <div className="border-2 border-red-900/60 bg-black p-5 sm:p-6 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between border-b border-red-900/30 pb-3">
                            <span className="text-red-400 font-bold text-xs sm:text-sm flex items-center gap-2">
                              <XOctagon className="h-4 w-4" /> THE TOUT MACHINE
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase">FEED // PUBLIC</span>
                          </div>

                          <div className="mt-4">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                              SELECTED SLATE: DAY {selectedDay} ({slateDays[selectedDay - 1].label})
                            </span>

                            {slateDays[selectedDay - 1].outcome === 'WIN' ? (
                              <div className="mt-3 p-4 sm:p-5 border border-emerald-500/40 bg-emerald-950/20 space-y-2">
                                <span className="text-xs text-emerald-300 font-bold block">🚨 WHALE PLAY CASHES! 💰</span>
                                <strong className="text-white block text-base font-bold">
                                  {slateDays[selectedDay - 1].pick} · {slateDays[selectedDay - 1].score}
                                </strong>
                                <p className="text-zinc-300 text-xs leading-relaxed">
                                  &ldquo;Easy cash as predicted! 10-0 heater this week! VIP subscription link in bio!&rdquo;
                                </p>
                                <span className="text-[10px] text-zinc-500 block">Tweeted at 10:45 PM · 4.2k Retweets</span>
                              </div>
                            ) : (
                              <div className="mt-3 p-4 sm:p-5 border-2 border-red-500/40 bg-red-950/30 space-y-3">
                                <div className="flex items-center justify-between text-red-400 text-xs font-bold">
                                  <span className="flex items-center gap-1.5"><Trash2 className="h-4 w-4" /> [404: POST DELETED]</span>
                                  <span className="text-[9px] text-zinc-500 uppercase">SCRUBBED FROM FEED</span>
                                </div>
                                <div className="border border-dashed border-red-800/40 p-3 text-zinc-500 text-xs line-through">
                                  &ldquo;Lock of the century on {slateDays[selectedDay - 1].pick}... max units!&rdquo;
                                </div>
                                <span className="text-xs text-amber-300 block leading-normal">
                                  ⚠️ Post purged 12 minutes after final ({slateDays[selectedDay - 1].score}). Fake 100% win rate claimed.
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-white/10 pt-3 text-xs text-zinc-500 flex justify-between">
                          <span>LOSS RECORDED:</span>
                          <strong className="text-red-400 font-bold">NO (SCRUBBED)</strong>
                        </div>
                      </div>

                      {/* VouchEdge Side */}
                      <div className="border-2 border-emerald-400/50 bg-black p-5 sm:p-6 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between border-b border-emerald-400/30 pb-3">
                            <span className="text-emerald-400 font-bold text-xs sm:text-sm flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" /> VOUCHEDGE PROTOCOL
                            </span>
                            <span className="text-[10px] text-cyan-300">SEALED // BLOCK #8821</span>
                          </div>

                          <div className="mt-4">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                              SELECTED SLATE: DAY {selectedDay} ({slateDays[selectedDay - 1].label})
                            </span>

                            {slateDays[selectedDay - 1].outcome === 'WIN' ? (
                              <div className="mt-3 p-4 sm:p-5 border border-emerald-500/40 bg-emerald-950/20 space-y-2">
                                <div className="flex justify-between text-xs font-bold text-emerald-300">
                                  <span>VERIFIED WIN ({slateDays[selectedDay - 1].score})</span>
                                  <span className="text-[10px] text-zinc-400">VARIANCE: +0.22</span>
                                </div>
                                <strong className="text-white block text-base font-bold">{slateDays[selectedDay - 1].pick}</strong>
                                <p className="text-zinc-300 text-xs leading-relaxed">
                                  Statcast exit velocity baseline confirmed against pitcher vulnerability matrix.
                                </p>
                                <span className="text-[10px] text-zinc-500 block">Sealed at 1:00 PM EDT · Hash: 0x9B2A4...</span>
                              </div>
                            ) : (
                              <div className="mt-3 p-4 sm:p-5 border-2 border-cyan-400/40 bg-zinc-900 space-y-3">
                                <div className="flex justify-between text-xs font-bold text-amber-300">
                                  <span>AUDITED LOSS ({slateDays[selectedDay - 1].score})</span>
                                  <span className="text-[9px] border border-cyan-400/40 bg-cyan-950/40 px-1.5 py-0.5 text-cyan-300 font-bold">
                                    08 LEARN ACTIVE
                                  </span>
                                </div>
                                <strong className="text-white block text-base font-bold">
                                  {slateDays[selectedDay - 1].pick} · Variance: -1.42
                                </strong>
                                <p className="text-zinc-300 text-xs leading-relaxed">
                                  Root cause: Reliever velocity overperformed baseline by +2.4 mph; wind shear in 7th neutralized fly balls.
                                </p>
                                <span className="text-xs text-emerald-400 font-bold block">
                                  ✓ Permanently recorded in historical learning baseline.
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-white/10 pt-3 text-xs text-zinc-400 flex justify-between">
                          <span>LOSS RECORDED:</span>
                          <strong className="text-emerald-400 font-bold">YES (FULL AUDIT WEIGHT)</strong>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PHASE 2: THE TRUTH OF NULL */}
                {active === 2 && (
                  <motion.div
                    key="stage-2"
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="h-full flex flex-col justify-between gap-4 sm:gap-5 font-mono"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                          PROTOCOL SIMULATOR // 02: THE POWER OF NO DATA
                        </span>
                        <strong className="text-white text-base sm:text-lg block mt-0.5">
                          Live Sensor Array: Test What Happens When an API Drops
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFeedFailureActive(!feedFailureActive)}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold border transition-colors cursor-pointer ${
                          feedFailureActive
                            ? 'border-amber-400 bg-amber-400 text-black'
                            : 'border-white/30 bg-black text-zinc-300 hover:border-white'
                        }`}
                      >
                        <Zap className="h-3.5 w-3.5" />
                        {feedFailureActive ? 'FEED FAILURE ACTIVE (SIMULATING)' : 'SIMULATE FEED DROP'}
                      </button>
                    </div>

                    {/* 4 Sensor Channels */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="border border-white/15 bg-black p-4 space-y-2 flex flex-col justify-between">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">STATCAST FEED</span>
                        <strong className="text-white text-base sm:text-lg font-black block">94.2% SYNCED</strong>
                        <span className="text-[9px] text-emerald-400 font-bold">● AVAILABLE</span>
                      </div>
                      <div className="border border-white/15 bg-black p-4 space-y-2 flex flex-col justify-between">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">PITCH VULN</span>
                        <strong className="text-white text-base sm:text-lg font-black block">78% ACCURACY</strong>
                        <span className="text-[9px] text-emerald-400 font-bold">● AVAILABLE</span>
                      </div>
                      <div className={`border p-4 space-y-2 flex flex-col justify-between transition-colors ${
                        feedFailureActive ? 'border-amber-400/60 bg-amber-950/30' : 'border-white/15 bg-black'
                      }`}>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">WEATHER RADAR</span>
                        <strong className={`text-base sm:text-lg font-black block ${feedFailureActive ? 'text-amber-300' : 'text-white'}`}>
                          {feedFailureActive ? 'NO RADAR PACKET' : '82°F · 12mph OUT'}
                        </strong>
                        <span className={`text-[9px] font-bold ${feedFailureActive ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {feedFailureActive ? '⚠️ UNAVAILABLE' : '● AVAILABLE'}
                        </span>
                      </div>
                      <div className={`border p-4 space-y-2 flex flex-col justify-between transition-colors ${
                        feedFailureActive ? 'border-amber-400/60 bg-amber-950/30' : 'border-white/15 bg-black'
                      }`}>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">BULLPEN STRAIN</span>
                        <strong className={`text-base sm:text-lg font-black block ${feedFailureActive ? 'text-amber-300' : 'text-white'}`}>
                          {feedFailureActive ? 'UNCONFIRMED' : 'HIGH STRAIN'}
                        </strong>
                        <span className={`text-[9px] font-bold ${feedFailureActive ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {feedFailureActive ? '⚠️ UNAVAILABLE' : '● AVAILABLE'}
                        </span>
                      </div>
                    </div>

                    {/* Reaction Comparison */}
                    <div className="grid gap-4 sm:gap-5 md:grid-cols-2 flex-1">
                      <div className="border-2 border-red-900/50 bg-black p-5 sm:p-6 space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-red-900/30 pb-2 text-xs">
                            <span className="text-red-400 font-bold text-xs sm:text-sm">TOUT / BLACK-BOX PLATFORM</span>
                            <span className="text-zinc-500 text-[10px]">OUTPUT: FABRICATED</span>
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="text-red-400 font-bold text-sm sm:text-base">
                              Synthetic Confidence Score: 96%
                            </div>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                              {feedFailureActive
                                ? 'Interpolating synthetic weather numbers to maintain fake marketing certainty. Late-inning risk concealed.'
                                : 'Standard synthetic probability meters displayed.'}
                            </p>
                          </div>
                        </div>
                        <div className="border-t border-white/10 pt-3 text-xs text-red-400 font-bold">
                          ❌ Hallucinating fake certainty to look authoritative.
                        </div>
                      </div>

                      <div className="border-2 border-emerald-400/50 bg-black p-5 sm:p-6 space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-emerald-400/30 pb-2 text-xs">
                            <span className="text-emerald-400 font-bold text-xs sm:text-sm">VOUCHEDGE PROTOCOL</span>
                            <span className="text-cyan-300 text-[10px]">OUTPUT: DETERMINISTIC</span>
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="text-amber-300 font-bold text-sm sm:text-base">
                              {feedFailureActive
                                ? 'Confidence Floor Adjusted: 74% → 42% (GAP FLAGGED)'
                                : 'Full Coverage Verified: 78%'}
                            </div>
                            <p className="text-zinc-300 text-xs leading-relaxed">
                              {feedFailureActive
                                ? 'Gaps stamped as UNAVAILABLE. System explicitly warns that late-inning bullpen and weather carry cannot be verified.'
                                : 'All 4 input layers verified and sourced.'}
                            </p>
                          </div>
                        </div>
                        <div className="border-t border-white/10 pt-3 text-xs text-emerald-400 font-bold">
                          ✓ Radical transparency: Missing data protects your downside.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PHASE 3: CRYPTO TIME-LOCK */}
                {active === 3 && (
                  <motion.div
                    key="stage-3"
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="h-full flex flex-col justify-between gap-4 sm:gap-5 font-mono"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">
                          PROTOCOL SIMULATOR // 03: PRE-PITCH THESIS LOCK
                        </span>
                        <strong className="text-white text-base sm:text-lg block mt-0.5">
                          Timeline State Machine: Zero Retroactive Spin
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        {[
                          { id: 1 as LockPhase, label: '1:00 PM DRAFT' },
                          { id: 2 as LockPhase, label: '1:05 PM LOCKED' },
                          { id: 3 as LockPhase, label: '4:30 PM FINAL' },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setLockPhase(p.id)}
                            className={`px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                              lockPhase === p.id
                                ? 'border-emerald-400 bg-emerald-400 text-black'
                                : 'border-white/20 bg-black text-zinc-300 hover:border-white'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-2 border-white/20 bg-black p-5 sm:p-7 flex flex-col justify-between flex-1 space-y-4">
                      <div>
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                          <span className="text-white font-bold text-xs sm:text-sm flex items-center gap-2">
                            <Lock className="h-4 w-4 text-emerald-400" />
                            THESIS_RECORD: #NYY-BOS-20260820-001
                          </span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold border ${
                            lockPhase === 1 ? 'border-cyan-400/40 text-cyan-300 bg-cyan-950/30' :
                            lockPhase === 2 ? 'border-amber-400/40 text-amber-300 bg-amber-950/30' :
                            'border-emerald-400/40 text-emerald-300 bg-emerald-950/30'
                          }`}>
                            {lockPhase === 1 ? 'ACTIVE RESEARCH DRAFT' : lockPhase === 2 ? '🔒 LOCKED & TIME-STAMPED (READ-ONLY)' : '✓ AUDITED WITH FINAL BOX SCORE'}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 text-xs mt-4">
                          <div className="bg-zinc-950 p-3 sm:p-4 border border-white/10 space-y-1">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">TIMESTAMP</span>
                            <strong className="text-white text-sm sm:text-base font-bold block">13:00:14 EDT</strong>
                            <span className="text-[8px] text-emerald-400">SEALED PRE-GAME</span>
                          </div>
                          <div className="bg-zinc-950 p-3 sm:p-4 border border-white/10 space-y-1">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">SHA-256 HASH</span>
                            <strong className="text-cyan-300 text-xs sm:text-sm font-bold block truncate">
                              0x7f83b165...
                            </strong>
                            <span className="text-[8px] text-zinc-500">IMMUTABLE BLOCK</span>
                          </div>
                          <div className="bg-zinc-950 p-3 sm:p-4 border border-white/10 space-y-1">
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">OUTCOME</span>
                            <strong className="text-white text-sm sm:text-base font-bold block">
                              {lockPhase === 3 ? 'FINAL: 6-2 (OVER CASHED)' : 'AWAITING RESULT'}
                            </strong>
                            <span className="text-[8px] text-zinc-500">OFFICIAL MLB SCORE</span>
                          </div>
                        </div>

                        <div className="mt-4 p-4 sm:p-5 bg-zinc-950 border border-white/10 text-xs sm:text-sm text-zinc-300 space-y-2">
                          <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-bold">
                            ORIGINAL LOCKED RATIONALE:
                          </span>
                          <p className="leading-relaxed">
                            &ldquo;High vulnerability on starting pitcher sinker profile (+18% launch angle deviation); Yankee Stadium wind blowing 11mph out to right field. Confirmed lineup shows 4 lefties in top 5 slots.&rdquo;
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-3 text-xs text-zinc-400 flex justify-between">
                        <span>RETROACTIVE EDITS PERMITTED:</span>
                        <strong className="text-emerald-400 font-bold">0 BYTES · MATHEMATICALLY SEALED</strong>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PHASE 4: SYSTEM TOPOLOGY & CONTRAST */}
                {active === 4 && (
                  <motion.div
                    key="stage-4"
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                    className="h-full flex flex-col justify-between gap-4 sm:gap-5 font-mono"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block">
                          SYSTEM TOPOLOGY // 04: GROUND TRUTH & HORIZON
                        </span>
                        <strong className="text-white text-base sm:text-lg block mt-0.5">
                          Toggle the Schematic Engine
                        </strong>
                      </div>
                      <div className="inline-flex p-0.5 border border-white/20 bg-zinc-900 text-xs">
                        <button
                          type="button"
                          onClick={() => setBlueprintMode('ground_truth')}
                          className={`px-4 py-1.5 font-bold text-xs transition-colors cursor-pointer ${
                            blueprintMode === 'ground_truth' ? 'bg-emerald-400 text-black' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          ● 01 GROUND TRUTH (BETA)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBlueprintMode('horizon_labs')}
                          className={`px-4 py-1.5 font-bold text-xs transition-colors cursor-pointer ${
                            blueprintMode === 'horizon_labs' ? 'bg-cyan-400 text-black' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          ◒ 02 HORIZON LABS (R&D)
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 flex-1">
                      {(blueprintMode === 'ground_truth' ? liveFeatures : horizonFeatures).map((feat) => {
                        const Icon = feat.icon;
                        return (
                          <div
                            key={feat.title}
                            className={`border-2 p-4 sm:p-5 flex flex-col justify-between bg-black transition-colors ${
                              blueprintMode === 'ground_truth' ? 'border-emerald-400/40 hover:border-emerald-400' : 'border-cyan-400/40 hover:border-cyan-400'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-8 w-8 items-center justify-center border border-white/15 bg-zinc-900">
                                    <Icon className={`h-4 w-4 ${blueprintMode === 'ground_truth' ? 'text-emerald-300' : 'text-cyan-300'}`} />
                                  </div>
                                  <strong className="text-white text-xs sm:text-sm font-bold">{feat.title}</strong>
                                </div>
                                <span className={`text-[8px] font-bold px-2 py-0.5 border ${
                                  blueprintMode === 'ground_truth'
                                    ? 'border-emerald-400/40 text-emerald-300 bg-emerald-950/30'
                                    : 'border-cyan-400/40 text-cyan-300 bg-cyan-950/30'
                                }`}>
                                  {feat.tag}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-300 leading-relaxed">{feat.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {onJoinBeta ? (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={onJoinBeta}
                          className="w-full inline-flex items-center justify-center gap-2 border-2 border-white bg-white py-3.5 sm:py-4 font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-black transition hover:bg-zinc-200 cursor-pointer rounded-none"
                        >
                          CLAIM FREE BETA ACCESS ($0 · NO CARD REQUIRED)
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* RECEIPT FOOTER */}
            <footer className="ve-protocolJourney__receipt">
              <span>{currentPhase.eyebrow}</span>
              <strong>{currentPhase.receipt}</strong>
            </footer>
          </div>
        </div>
      </div>
    </section>
  );
}



