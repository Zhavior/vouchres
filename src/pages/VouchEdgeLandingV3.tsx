import '../styles/vouchres-ultimate-truth-landing.css';
import '../styles/public-landing.css';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  DecisionIntelligence,
  CommunitySection,
  PricingSection,
  FAQSection,
  CTASection,
  FooterSection,
  type FooterNavigationTarget,
} from '../components/landing-v3';

type Step = 1 | 2 | 3 | 4;
type Scene = 'hero' | 'ledger' | 'proof';
type Props = {
  onLogin: () => void;
  onJoinBeta: () => void;
  onViewDemo: () => void;
  onExploreCommunity: () => void;
  onFooterNavigate: (target: FooterNavigationTarget) => void;
};

const steps = [
  { id: 1 as Step, tag: 'ACT 1 / MATCHUP SETUP', title: 'Start with an MLB board built for decisions, not noise.', body: 'Build a faster pre-game case with matchup context, high-signal telemetry, and explicit evidence states.', proof: 'LIVE SCHEDULE + LINKED RESEARCH', metric: '01/04', status: 'MATCHUP READY' },
  { id: 2 as Step, tag: 'ACT 2 / EVIDENCE SIGNALS', title: 'Surface the power signals before first pitch.', body: 'Statcast contact quality, pitcher vulnerability, lineup validation, weather, and bullpen leverage sit in one research workflow.', proof: 'EVIDENCE STATES EXPLICIT', metric: '02/04', status: 'SIGNALS REVIEWED' },
  { id: 3 as Step, tag: 'ACT 3 / DECISION LOCK', title: 'Lock the thesis while the market is still live.', body: 'Save the thesis, confidence, and supporting signals before first pitch—then measure the call against the final.', proof: 'TIME-BOUND DECISION RECORD', metric: '03/04', status: 'RECORD LOCKED' },
  { id: 4 as Step, tag: 'ACT 4 / IMMUTABLE PROOF', title: 'Audit the call. Keep the learning loop.', body: 'Every result remains connected to the original pre-game research so you can refine your process slate after slate.', proof: 'POST-GAME COMPARISON', metric: '04/04', status: 'OUTCOME RETAINED' },
];

const STORY_MATCHUPS = [
  { batter: 'SHOHEI OHTANI', batterId: 660271, matchup: 'LAD @ MIL', team: 'LAD', stats: { avg: '.295', homeRuns: 29, rbi: 78, ops: '.948' } },
  { batter: 'AARON JUDGE', batterId: 592450, matchup: 'NYY @ TOR', team: 'NYY', stats: { avg: '.248', homeRuns: 17, rbi: 38, ops: '.908' } },
  { batter: 'PETE CROW-ARMSTRONG', batterId: 691718, matchup: 'STL @ CHC', team: 'CHC', stats: { avg: '.282', homeRuns: 31, rbi: 79, ops: '.934' } },
  { batter: 'MIKE TROUT', batterId: 545361, matchup: 'KC @ LAA', team: 'LAA', stats: { avg: '.242', homeRuns: 20, rbi: 45, ops: '.824' } },
];

function mlbHeadshot(personId?: number) {
  return personId
    ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_160,q_auto:best/v1/people/${personId}/headshot/67/current`
    : 'https://img.mlbstatic.com/mlb-photos/image/upload/w_160,q_auto:best/v1/people/592450/headshot/67/current';
}

function Artifact({ step }: { step: Step }) {
  const act = step;
  const matchup = STORY_MATCHUPS[step - 1];
  return (
    <div className="vu-actCanvas">
      <motion.div
        key={matchup.team}
        className="vu-teamWatermark"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden="true"
      >
        <span>{matchup.team}</span>
        <small>{matchup.team}</small>
      </motion.div>
      <div className="vu-windowBar">
        <span><i /><i /><i /></span>
        <b>{matchup.matchup} // HR RESEARCH HUD</b>
        <em>FINAL · VERIFIED SNAPSHOT</em>
      </div>
      <div className="vu-gameHeader">
        <div className="vu-playerIdentity">
          <img src={mlbHeadshot(matchup.batterId)} alt={matchup.batter} />
          <div>
            <span>BATTER</span>
            <strong>{matchup.batter}</strong>
            <small>LIVE VERIFIED SNAPSHOT</small>
          </div>
        </div>
        <div className="vu-gameAt">VS</div>
        <div className="vu-liveStatsCard">
          <div className="vu-statsBanner">
            <span>● LIVE VERIFIED SNAPSHOT</span>
            <b>MLB DATA</b>
          </div>
          <div className="vu-statsValues">
            <div><span>AVG</span><strong>{matchup.stats.avg}</strong></div>
            <div><span>HR</span><strong>{matchup.stats.homeRuns}</strong></div>
            <div><span>RBI</span><strong>{matchup.stats.rbi}</strong></div>
            <div><span>OPS</span><strong>{matchup.stats.ops}</strong></div>
          </div>
          <small>Official MLB data · refreshes when available</small>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={act}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="vu-actLayer"
        >
          {act === 1 && (
            <div className="vu-hudGrid">
              <section>
                <p className="vu-hudLabel">HR TELEMETRY <b>VERIFIED</b></p>
                <div className="vu-hudMetrics">
                  <div><span>AVG EXIT VELO</span><strong>98.4 MPH</strong></div>
                  <div><span>BARREL RATE</span><strong>21.4%</strong></div>
                  <div><span>HARD-HIT RATE</span><strong>56.8%</strong></div>
                  <div><span>HR / PA</span><strong>8.7%</strong></div>
                </div>
              </section>
              <section>
                <p className="vu-hudLabel">GAME CONTEXT <b className="partial">PARTIAL</b></p>
                <div className="vu-hudMetrics">
                  <div><span>PITCHER RISK</span><strong>HIGH · CUTTER</strong></div>
                  <div><span>BULLPEN LOAD</span><strong>3.2 IP / 24H</strong></div>
                  <div><span>LINEUP STATUS</span><strong>CONFIRMED</strong></div>
                  <div><span>WEATHER FEED</span><strong className="vu-mutedMetric">AWAITING</strong></div>
                </div>
              </section>
            </div>
          )}
          {act === 2 && (
            <div className="vu-signalGrid">
              <article><span>CONTACT QUALITY</span><b>98.4 MPH / 21.4% BARREL</b><p>Power profile, visible at a glance.</p></article>
              <article><span>PITCH ARSENAL</span><b>HIGH CUTTER EXPOSURE</b><p>Matchup risk is explicit.</p></article>
              <article><span>LINEUP VALIDATION</span><b>CONFIRMED</b><p>Official lineup feed received.</p></article>
              <article><span>WEATHER</span><b className="partial">AWAITING FEED</b><p>Never filled with a guess.</p></article>
            </div>
          )}
          {act === 3 && (
            <div className="vu-lockCard">
              <div><span>THE VOUCH RECORD</span><b>TIME-STAMPED</b></div>
              <strong>ORIGINAL THESIS + CONFIDENCE</strong>
              <p>Research conclusion, high-signal telemetry, and availability notes are retained as they existed before first pitch.</p>
              <footer><i>VISIBLE EDIT HISTORY</i><em>LOCKED BEFORE RESULT</em></footer>
            </div>
          )}
          {act === 4 && (
            <div className="vu-auditCard">
              <div><span>POST-GAME AUDIT</span><b>OFFICIAL RESULT</b></div>
              <strong>COMPARE THE RECORD TO THE FINAL.</strong>
              <p>Correct and incorrect outcomes remain attached to the original research record—no selective highlight reel.</p>
              <footer><i>OUTCOME RETAINED</i><em>PUBLIC PROOF</em></footer>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Terminal({ step, hero = false }: { step: Step; hero?: boolean }) {
  const item = steps[step - 1];
  return (
    <section className={`vu-terminal ${hero ? 'vu-heroTerminal' : ''}`}>
      <header>
        <span>VOUCHEDGE // ENGINE: VOUCHRES // 0{step} // {hero ? 'PUBLIC PROOF' : item.tag.split(' / ')[1]}</span>
        <i>LIVE</i>
      </header>
      <div className="vu-terminalBody">
        <Artifact step={step} />
      </div>
      <footer>
        <span>RECORD / VOUCHEDGE</span>
        <span>{item.status}</span>
        <b>{item.metric}</b>
      </footer>
    </section>
  );
}

function TruthFlow({ onJoinBeta, onViewDemo }: Pick<Props, 'onJoinBeta' | 'onViewDemo'>) {
  const canvas = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<Scene>('hero');
  const [active, setActive] = useState<Step>(1);
  const [videoMuted, setVideoMuted] = useState(true);
  const [introDocked, setIntroDocked] = useState(false);
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  // Time-based and playback-based docking triggers
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime / video.duration >= 0.6 && !introDocked) {
        setIntroDocked(true);
      }
    };
    const handleEnded = () => {
      setIntroDocked(true);
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    const timer = window.setTimeout(() => setIntroDocked(true), 6000);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      window.clearTimeout(timer);
    };
  }, [introDocked]);

  useEffect(() => {
    if (introDocked) return;
    const timer = window.setTimeout(() => setIntroDocked(true), 4000);
    return () => window.clearTimeout(timer);
  }, [introDocked]);

  const replayHeroVideo = () => {
    const video = heroVideoRef.current;
    if (!video) return;
    setIntroDocked(false);
    video.currentTime = 0;
    void video.play();
  };

  const { scrollYProgress: rawScrollYProgress } = useScroll({
    target: canvas,
    offset: ['start start', 'end end'],
  });
  const scrollYProgress = useSpring(rawScrollYProgress, { stiffness: 80, damping: 24, restDelta: 0.001 });
  const sceneRef = useRef<Scene>('hero');
  const stepRef = useRef<Step>(1);

  useMotionValueEvent(scrollYProgress, 'change', p => {
    if (!introDocked && p > 0.02) {
      setIntroDocked(true);
    }
    const next: Scene = p < 0.16 ? 'hero' : p < 0.8 ? 'ledger' : 'proof';
    if (next !== sceneRef.current) {
      sceneRef.current = next;
      setScene(next);
    }
    if (next === 'ledger') {
      const s = Math.min(4, Math.max(1, Math.floor((p - 0.16) / 0.16) + 1)) as Step;
      if (s !== stepRef.current) {
        stepRef.current = s;
        setActive(s);
      }
    }
  });

  const go = (stop: number) => {
    const el = canvas.current;
    if (!el) return;
    const start = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: start + (el.offsetHeight - window.innerHeight) * stop, behavior: 'smooth' });
  };

  return (
    <div
      id="truth-flow"
      ref={canvas}
      className="vu-story bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
    >
      <div className="vu-pinned">
        <div className="vu-frame">
          <AnimatePresence mode="wait">
            <motion.section
              key={scene}
              className="vu-scene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {scene === 'hero' && (
                <div className="vu-heroGrid">
                  <div className="vu-copy">
                    <span className="vu-eyebrow">● VOUCHEDGE // ENGINE: VOUCHRES · MLB RESEARCH / PUBLIC PROOF</span>
                    <h1 className="text-zinc-100 font-bold tracking-tight">
                      Stop guessing. <br />
                      <span className="bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                        Build an auditable MLB research ledger before first pitch.
                      </span>
                    </h1>
                    <p>VouchEdge pairs Statcast telemetry, pitcher-vulnerability splits, and lineup validation into a decision record you can inspect, track, and improve.</p>
                    <div className="vu-ctas">
                      <button className="vu-primary" onClick={onJoinBeta}>OPEN TODAY’S SLATE — FREE BETA</button>
                      <button onClick={() => { onViewDemo(); document.getElementById('research-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
                        INSPECT SAMPLE LEDGER <span>↓</span>
                      </button>
                    </div>
                    <div className="vu-meta">
                      <span>HR TELEMETRY + PITCHER SPLITS</span>
                      <span>LINEUP + BULLPEN CONTEXT</span>
                      <span>LOCKED PRE-GAME RECORD</span>
                    </div>
                  </div>

                  {/* Full-Screen to Docked Video Visual */}
                  <div className={`vu-heroVisual ${introDocked ? 'vu-docked' : 'vu-fullscreenIntro'}`}>
                    {!introDocked && (
                      <button className="vu-skipIntro" type="button" onClick={() => setIntroDocked(true)}>
                        SKIP INTRO ✕
                      </button>
                    )}
                    <div className="vu-videoFrame">
                      <video ref={heroVideoRef} className="vu-heroVideo" autoPlay muted={videoMuted} loop playsInline preload="metadata" aria-label="VouchEdge product preview">
                        <source src="/media/vouchedge-landing-60fps.mp4" type="video/mp4" />
                      </video>
                      <div className="vu-videoScan" aria-hidden="true" />
                      <div className="vu-videoLabel">
                        <div>
                          <button className="vu-videoReplay" type="button" aria-label="Replay VouchEdge product intro" onClick={replayHeroVideo}>
                            ↻ REPLAY
                          </button>
                          <button
                            className="vu-videoAudio"
                            type="button"
                            aria-pressed={!videoMuted}
                            aria-label={videoMuted ? 'Unmute VouchEdge product video' : 'Mute VouchEdge product video'}
                            onClick={() => {
                              const next = !videoMuted;
                              setVideoMuted(next);
                              if (heroVideoRef.current) {
                                heroVideoRef.current.muted = next;
                                void heroVideoRef.current.play();
                              }
                            }}
                          >
                            {videoMuted ? '◌ SOUND OFF' : '◉ SOUND ON'}
                          </button>
                          <b>60 FPS · LIVE RESEARCH FLOW</b>
                        </div>
                      </div>
                    </div>
                    <Terminal step={1} hero />
                  </div>
                </div>
              )}

              {scene === 'ledger' && (
                <div className="vu-ledgerGrid">
                  <div className="vu-copy vu-ledgerCopy">
                    <motion.div
                      key={steps[active - 1].tag}
                      className="vu-actTeamLabel"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 0.82, y: 0 }}
                      transition={{ duration: 0.45 }}
                    >
                      <span>TEAM / {STORY_MATCHUPS[active - 1].team}</span>
                      <b>{STORY_MATCHUPS[active - 1].matchup}</b>
                    </motion.div>
                    <span className="vu-eyebrow">VOUCHEDGE FLOW / 0{active} OF 04</span>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={active}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <h2>{steps[active - 1].title}</h2>
                        <p>{steps[active - 1].body}</p>
                        <div className="vu-proof">
                          <span>{steps[active - 1].proof}</span>
                          <b>VOUCHEDGE</b>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <Terminal step={active} />
                </div>
              )}

              {scene === 'proof' && (
                <div className="vu-proofScene">
                  <span className="vu-eyebrow">THE VOUCH RECORD</span>
                  <h2>Research. Vouch. Prove it.</h2>
                  <p>Every meaningful decision retains the context that made it worth taking, then meets the result in a record that cannot quietly rewrite the past.</p>
                  <div>
                    <span>RESEARCHED</span><i>→</i><span>TIME STAMPED</span><i>→</i><span>GRADED</span><i>→</i><span>PUBLIC</span>
                  </div>
                </div>
              )}
            </motion.section>
          </AnimatePresence>
        </div>

        <div className="vu-scrubber">
          <button className={scene === 'hero' ? 'active' : ''} onClick={() => go(0)}>INTRO</button>
          <div className="vu-rail">
            {steps.map((s, i) => (
              <button
                key={s.id}
                aria-label={`Act ${s.id}`}
                className={scene === 'ledger' && active === s.id ? 'active' : ''}
                onClick={() => go(0.16 + i * 0.16 + 0.035)}
              />
            ))}
          </div>
          <span>{scene === 'ledger' ? steps[active - 1].tag : scene === 'proof' ? 'PUBLIC PROOF' : 'LIVE RESEARCH'}</span>
          <button className={scene === 'proof' ? 'active' : ''} onClick={() => go(0.86)}>PROOF</button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   HIGH-CRAFT DECISION LEDGER WITH HARDWARE BADGES & HOVER TELEMETRY
   ========================================================================= */
function ResearchRecordBridge() {
  const bridgeRef = useRef<HTMLElement>(null);
  const { scrollYProgress: rawBridgeProgress } = useScroll({ target: bridgeRef, offset: ['start start', 'end end'] });
  const scrollYProgress = useSpring(rawBridgeProgress, { stiffness: 80, damping: 24, restDelta: 0.001 });
  const [phase, setPhase] = useState(0);

  const phases = [
    { eyebrow: '01 / ORIGINAL RESEARCH', title: 'Track the decision.', body: 'Keep the original case intact: matchup evidence, confidence, and the exact context available before first pitch.', label: 'RESEARCH SAVED', detail: 'Signals, thesis, timestamp' },
    { eyebrow: '02 / DECISION LOCKED', title: 'Keep the record.', body: 'Lock the call before the result arrives. The decision cannot be rewritten after the market or game changes.', label: 'THESIS LOCKED', detail: 'Pre-game record preserved' },
    { eyebrow: '03 / WINS + LOSSES', title: 'Show the whole record.', body: 'Wins and losses remain visible together, so the scoreboard measures the process honestly—not just the highlights.', label: 'OUTCOMES GRADED', detail: 'Win · Loss · Review' },
    { eyebrow: '04 / METHODOLOGY', title: 'Make the next call better.', body: 'Review what held up, where the evidence failed, and turn every completed record into a sharper research workflow.', label: 'LOOP COMPLETE', detail: 'Research → decision → result' },
  ];

  useMotionValueEvent(scrollYProgress, 'change', value => {
    bridgeRef.current?.style.setProperty('--ledger-progress', String(Math.min(1, Math.max(0, value))));
    const next = Math.min(phases.length - 1, Math.max(0, Math.floor(value * phases.length)));
    if (next !== phase) setPhase(next);
  });

  const record = [
    {
      player: 'S. OHTANI',
      pick: 'HR · +310',
      result: 'WIN',
      note: 'BARREL + PARK FIT',
      ev: '112.4 MPH',
      la: '28°',
      dist: '438 FT',
      tone: 'win' as const,
    },
    {
      player: 'A. JUDGE',
      pick: 'HR · +275',
      result: 'LOSS',
      note: 'CONTACT DID NOT CONVERT',
      ev: '106.8 MPH',
      la: '36°',
      dist: '388 FT (F8)',
      tone: 'loss' as const,
    },
    {
      player: 'P. CROW-ARMSTRONG',
      pick: 'HR · +420',
      result: 'WIN',
      note: 'PITCHER VULNERABILITY',
      ev: '104.2 MPH',
      la: '24°',
      dist: '412 FT',
      tone: 'win' as const,
    },
  ];

  const current = phases[phase];

  return (
    <section
      ref={bridgeRef}
      id="research-preview"
      className="vu-realSection vu-decisionStory relative bg-[#050507] bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
    >
      <div className="vu-decisionPinned">
        <div className="vu-decisionGrid max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          
          {/* Left Column: Aggressive High-Tech Headline & Integrated Trace Rail */}
          <div className="vu-decisionCopy space-y-6">
            <span className="vu-eyebrow text-cyan-400 font-mono text-xs tracking-wider">
              {current.eyebrow}
            </span>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              {phase === 3 ? (
                <>
                  <span className="text-zinc-100">MAKE THE NEXT</span> <br />
                  <span className="bg-gradient-to-r from-zinc-100 via-cyan-200 to-zinc-400 bg-clip-text text-transparent">
                    CALL BETTER.
                  </span>
                </>
              ) : (
                <span className="text-zinc-100">{current.title}</span>
              )}
            </h2>

            <p className="text-zinc-400 text-base leading-relaxed max-w-lg">
              {current.body}
            </p>

            <div className="vu-decisionStatus flex items-center justify-between gap-4 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/80 font-mono text-xs">
              <span className="text-emerald-400 font-bold tracking-wide">{current.label}</span>
              <b className="text-zinc-300 font-normal">{current.detail}</b>
            </div>

            {/* Integrated Horizontal Timeline Trace Rail */}
            <div className="flex items-center gap-2 pt-2">
              {phases.map((item, idx) => {
                const isCurrent = idx === phase;
                const isPassed = idx < phase;
                return (
                  <div key={item.eyebrow} className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-all duration-300 ${
                        isCurrent
                          ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.2)] font-bold'
                          : isPassed
                          ? 'text-zinc-400 bg-zinc-900/60 border border-zinc-800/80'
                          : 'text-zinc-600 bg-zinc-950/40 border border-zinc-900'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isCurrent ? 'bg-emerald-400 animate-pulse' : isPassed ? 'bg-emerald-500/60' : 'bg-zinc-700'
                        }`}
                      />
                      <span>0{idx + 1}</span>
                    </div>
                    {idx < phases.length - 1 && (
                      <div className={`w-3 sm:w-6 h-[1px] ${idx < phase ? 'bg-emerald-500/40' : 'bg-zinc-800'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Decision Ledger & Telemetry HUD Card with Ambient Glow & 1px Border */}
          <div className="w-full max-w-xl mx-auto rounded-2xl border border-zinc-700/80 bg-zinc-950/95 shadow-[0_0_50px_-12px_rgba(52,211,153,0.15)] backdrop-blur-2xl p-5 sm:p-6">
            
            {/* Header Metadata with Live Block Badge & Pre-Pitch Stamp */}
            <div className="flex flex-wrap justify-between items-center border-b border-zinc-800/80 pb-3.5 mb-4 font-mono text-[11px] text-zinc-400 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-200 font-medium">VOUCHEDGE / DECISION LEDGER</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400">
                  LEDGER LOCK: #0x8F9A...
                </span>
                <span className="text-emerald-400 font-semibold text-[10px]">
                  ● STAMPED PRE-PITCH
                </span>
              </div>
            </div>

            {/* Headline Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 mb-4 text-center font-mono">
              <div>
                <small className="block text-[10px] text-zinc-500">TRACKED DECISIONS</small>
                <strong className="text-lg sm:text-xl font-bold text-white mt-0.5 block">23</strong>
              </div>
              <div>
                <small className="block text-[10px] text-zinc-500">WIN RATE</small>
                <strong className="text-lg sm:text-xl font-bold text-emerald-400 mt-0.5 block">60.9%</strong>
              </div>
              <div>
                <small className="block text-[10px] text-zinc-500">AUDIT STATUS</small>
                <strong className="text-lg sm:text-xl font-bold text-cyan-400 mt-0.5 block">PUBLIC</strong>
              </div>
            </div>

            {/* Outcome Rows with Micro-Interactions & Secondary Statcast Pills */}
            <div className="space-y-2.5 mb-4">
              {record.map((item, index) => (
                <article
                  key={item.player}
                  className={`group p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/50 hover:border-zinc-700/80 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    phase >= 2 || index === 0 ? 'opacity-100' : 'opacity-45'
                  }`}
                >
                  <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white font-mono text-sm font-bold">{item.player}</strong>
                        <span className="text-zinc-500 font-mono text-[11px]">{item.pick}</span>
                      </div>
                      {/* Secondary Statcast metrics revealed on hover */}
                      <div className="text-[10px] font-mono text-cyan-400/80 group-hover:text-cyan-300 transition-colors mt-0.5">
                        {item.ev} · {item.la} · {item.dist}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                    <span className="font-mono tracking-tight text-[11px] uppercase bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-zinc-300">
                      {item.note}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold tracking-wider ${
                        item.tone === 'win'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                      }`}
                    >
                      {item.result}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Footnote */}
            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/80">
              <span>PRE-GAME CONTEXT RETAINED</span>
              <span>OUTCOMES NEVER HIDDEN</span>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

export default function VouchEdgeLandingV3(props: Props) {
  return (
    <main className="vu-landing bg-[#050507] text-white">
      <nav className="fixed top-0 left-0 w-full h-[64px] z-50 px-6 lg:px-8 flex items-center justify-between bg-[#050507]/80 backdrop-blur-xl border-b border-zinc-800/80">
        <a href="#top" className="inline-flex items-center gap-2.5 text-white no-underline text-sm font-bold tracking-wide">
          <img src="/vouchedge-mark-aurora.svg" alt="VouchEdge Logo" width="24" height="24" aria-hidden="true" />
          <span>VOUCHEDGE</span>
          <b className="px-1.5 py-0.5 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-mono text-[9px] rounded font-medium">
            BETA
          </b>
        </a>
        <div className="flex items-center gap-3">
          <button
            onClick={props.onLogin}
            className="px-3.5 py-1.5 text-xs font-mono text-zinc-400 hover:text-white transition"
          >
            LOG IN
          </button>
          <button
            onClick={props.onJoinBeta}
            className="px-3.5 py-1.5 border border-zinc-300 text-black bg-white hover:bg-zinc-200 text-xs font-mono font-semibold rounded transition"
          >
            Get access
          </button>
        </div>
      </nav>

      <div id="how-it-works" className="pt-[64px]">
        <div id="top">
          <TruthFlow onJoinBeta={props.onJoinBeta} onViewDemo={props.onViewDemo} />
        </div>
      </div>

      <div id="record">
        <ResearchRecordBridge />
      </div>

      <motion.section
        id="transparency-over-hype"
        className="vu-integrityNote vu-chapter vu-chapterIntegrity"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.6, margin: '0px 0px -100px 0px' }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } } }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0 } }}>
          <span className="vu-eyebrow">RESEARCH LIMITS / PUBLIC RECORD</span>
          <h2>Evidence should explain itself.</h2>
          <p>Confidence describes the strength of the available evidence, not a promise of an outcome. VouchRes keeps missing-data notes visible and does not curate a highlight reel of only successful examples.</p>
        </motion.div>
        <motion.div className="vu-integrityChain" variants={{ hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0 } }}>
          <span>RESEARCHED</span><i>→</i><span>TIME STAMPED</span><i>→</i><span>COMPARED TO RESULT</span><i>→</i><span>RETAINED</span>
        </motion.div>
      </motion.section>

      <div className="vu-chapter vu-chapterDecision"><DecisionIntelligence /></div>
      <div className="vu-chapter vu-chapterCommunity"><CommunitySection onExploreCommunity={props.onExploreCommunity} /></div>
      <div className="vu-chapter vu-chapterPricing"><PricingSection onJoinBeta={props.onJoinBeta} /></div>
      <div className="vu-chapter vu-chapterFAQ"><FAQSection /></div>
      <div className="vu-chapter vu-chapterCTA"><CTASection onJoinBeta={props.onJoinBeta} onViewDemo={props.onViewDemo} /></div>
      <FooterSection onNavigate={props.onFooterNavigate} />
    </main>
  );
}
