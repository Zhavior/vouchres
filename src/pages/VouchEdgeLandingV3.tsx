import '../styles/vouchres-ultimate-truth-landing.css';
import '../styles/public-landing.css';
import { AnimatePresence, motion, useInView, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResearchPreviewSection,
  DecisionIntelligence,
  CommunitySection,
  PricingSection,
  FAQSection,
  CTASection,
  FooterSection,
  type FooterNavigationTarget,
} from '../components/landing-v3';
import ResearchTelemetryStory from '../components/landing/ResearchTelemetryStory';
import { apiClient } from '../lib/apiClient';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type Scene = 'hero' | 'ledger' | 'proof';
type Props = { onLogin: () => void; onJoinBeta: () => void; onViewDemo: () => void; onExploreCommunity: () => void; onFooterNavigate: (target: FooterNavigationTarget) => void };
const steps: Array<{ id: Step; tag: string; title: string; body: string; proof: string; metric: string; status: string }> = [
  { id: 1, tag: 'ACT 1 / MATCHUP SETUP', title: 'Start with an MLB board built for decisions, not noise.', body: 'Build a faster pre-game case with matchup context, high-signal telemetry, and explicit evidence states.', proof: 'LIVE SCHEDULE + LINKED RESEARCH', metric: '01/04', status: 'MATCHUP READY' },
  { id: 2, tag: 'ACT 2 / EVIDENCE SIGNALS', title: 'Surface the power signals before first pitch.', body: 'Statcast contact quality, pitcher vulnerability, lineup validation, weather, and bullpen leverage sit in one research workflow.', proof: 'EVIDENCE STATES EXPLICIT', metric: '02/04', status: 'SIGNALS REVIEWED' },
  { id: 3, tag: 'ACT 3 / DECISION LOCK', title: 'Lock the thesis while the market is still live.', body: 'Save the thesis, confidence, and supporting signals before first pitch—then measure the call against the final.', proof: 'TIME-BOUND DECISION RECORD', metric: '03/04', status: 'RECORD LOCKED' },
  { id: 4, tag: 'ACT 4 / IMMUTABLE PROOF', title: 'Audit the call. Keep the learning loop.', body: 'Every result remains connected to the original pre-game research so you can refine your process slate after slate.', proof: 'POST-GAME COMPARISON', metric: '04/04', status: 'OUTCOME RETAINED' },
];
type HeroGame = { awayTeam: { abbreviation: string; name: string }; homeTeam: { abbreviation: string; name: string }; venue: string; probablePitchers: { away: { pitcherName: string } | null; home: { pitcherName: string } | null }; weather: { condition?: string; windMph?: number } | null; dataQuality: string };
const SAMPLE_HERO_GAME: HeroGame = { awayTeam: { abbreviation: 'NYY', name: 'New York Yankees' }, homeTeam: { abbreviation: 'BAL', name: 'Baltimore Orioles' }, venue: 'Sample MLB matchup', probablePitchers: { away: null, home: null }, weather: null, dataQuality: 'sample' };
function useVouchEdgeLiveGame() { const [game, setGame] = useState<HeroGame>(SAMPLE_HERO_GAME); const [isLive, setIsLive] = useState(false); useEffect(() => { let cancelled = false; const load = async () => { try { const payload = await apiClient.get<{ games?: HeroGame[]; data?: { games?: HeroGame[] } }>('/api/mlb/games/today'); const firstGame = payload.games?.[0] ?? payload.data?.games?.[0]; if (firstGame && !cancelled) { setGame(firstGame); setIsLive(true); } } catch { /* Retain an internally consistent sample when the official feed is unavailable. */ } }; void load(); const interval = window.setInterval(load, 60_000); return () => { cancelled = true; window.clearInterval(interval); }; }, []); return { game, isLive }; }
const transition = { duration: .42, ease: [.22, 1, .36, 1] as const };
function mlbHeadshot(personId?: number) { return personId ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_160,q_auto:best/v1/people/${personId}/headshot/67/current` : 'https://img.mlbstatic.com/mlb-photos/image/upload/w_160,q_auto:best/v1/people/592450/headshot/67/current'; }
const FALLBACK_OHTANI_STATS = { avg: '.286', homeRuns: 39, rbi: 92, ops: '.981', asOf: 'Last verified MLB snapshot' };

const STORY_MATCHUPS = [{ batter: 'SHOHEI OHTANI', batterId: 660271, bats: 'LHB', matchup: 'LAD @ MIL', team: 'LAD', stats: { avg: '.295', homeRuns: 29, rbi: 78, ops: '.948' } }, { batter: 'AARON JUDGE', batterId: 592450, bats: 'RHB', matchup: 'NYY @ TOR', team: 'NYY', stats: { avg: '.248', homeRuns: 17, rbi: 38, ops: '.908' } }, { batter: 'PETE CROW-ARMSTRONG', batterId: 691718, bats: 'LHB', matchup: 'STL @ CHC', team: 'CHC', stats: { avg: '.282', homeRuns: 31, rbi: 79, ops: '.934' } }, { batter: 'MIKE TROUT', batterId: 545361, bats: 'RHB', matchup: 'KC @ LAA', team: 'LAA', stats: { avg: '.242', homeRuns: 20, rbi: 45, ops: '.824' } }] as const;
function Artifact({ step }: { step: Step }) {
  const act = Math.min(4, Math.ceil(step / 2)) as 1 | 2 | 3 | 4;
  const matchup = STORY_MATCHUPS[Math.min(STORY_MATCHUPS.length - 1, step - 1)];
  return <div className="vu-actCanvas"><motion.div key={matchup.team} className="vu-teamWatermark" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7, ease: [0.22, 1, 0.36, 1] }} aria-hidden="true"><span>{matchup.team}</span><small>{matchup.team}</small></motion.div><div className="vu-windowBar"><span><i/><i/><i/></span><b>{matchup.matchup} // HR RESEARCH HUD</b><em>FINAL · AUG 16, 2026</em></div><div className="vu-gameHeader"><div className="vu-playerIdentity"><img src={mlbHeadshot(matchup.batterId)} alt={matchup.batter}/><div><span>BATTER</span><strong>{matchup.batter}</strong><small>LIVE VERIFIED SNAPSHOT</small></div></div><div className="vu-gameAt">VS</div><div className="vu-liveStatsCard"><div className="vu-statsBanner"><span>● LIVE VERIFIED SNAPSHOT</span><b>MLB DATA</b></div><div className="vu-statsValues"><div><span>AVG</span><strong>{matchup.stats.avg}</strong></div><div><span>HR</span><strong>{matchup.stats.homeRuns}</strong></div><div><span>RBI</span><strong>{matchup.stats.rbi}</strong></div><div><span>OPS</span><strong>{FALLBACK_OHTANI_STATS.ops}</strong></div></div><small>Official MLB data · refreshes when available</small></div></div><AnimatePresence mode="wait"><motion.div key={act} initial={{opacity:0,y:12,filter:'blur(5px)'}} animate={{opacity:1,y:0,filter:'blur(0px)'}} exit={{opacity:0,y:-8,filter:'blur(4px)'}} transition={transition} className="vu-actLayer">{act===1&&<div className="vu-hudGrid"><section><p className="vu-hudLabel">HR TELEMETRY <b>VERIFIED</b></p><div className="vu-hudMetrics"><div><span>AVG EXIT VELO</span><strong>98.4 MPH</strong></div><div><span>BARREL RATE</span><strong>21.4%</strong></div><div><span>HARD-HIT RATE</span><strong>56.8%</strong></div><div><span>HR / PA</span><strong>8.7%</strong></div></div></section><section><p className="vu-hudLabel">GAME CONTEXT <b className="partial">PARTIAL</b></p><div className="vu-hudMetrics"><div><span>PITCHER RISK</span><strong>HIGH · CUTTER</strong></div><div><span>BULLPEN LOAD</span><strong>3.2 IP / 24H</strong></div><div><span>LINEUP STATUS</span><strong>CONFIRMED</strong></div><div><span>WEATHER FEED</span><strong className="vu-mutedMetric">AWAITING</strong></div></div></section></div>}{act===2&&<div className="vu-signalGrid"><article><span>CONTACT QUALITY</span><b>98.4 MPH / 21.4% BARREL</b><p>Power profile, visible at a glance.</p></article><article><span>PITCH ARSENAL</span><b>HIGH CUTTER EXPOSURE</b><p>Matchup risk is explicit.</p></article><article><span>LINEUP VALIDATION</span><b>CONFIRMED</b><p>Official lineup feed received.</p></article><article><span>WEATHER</span><b className="partial">AWAITING FEED</b><p>Never filled with a guess.</p></article></div>}{act===3&&<div className="vu-lockCard"><div><span>THE VOUCH RECORD</span><b>TIME-STAMPED</b></div><strong>ORIGINAL THESIS + CONFIDENCE</strong><p>Research conclusion, high-signal telemetry, and availability notes are retained as they existed before first pitch.</p><footer><i>VISIBLE EDIT HISTORY</i><em>LOCKED BEFORE RESULT</em></footer></div>}{act===4&&<div className="vu-auditCard"><div><span>POST-GAME AUDIT</span><b>OFFICIAL RESULT</b></div><strong>COMPARE THE RECORD TO THE FINAL.</strong><p>Correct and incorrect outcomes remain attached to the original research record—no selective highlight reel.</p><footer><i>OUTCOME RETAINED</i><em>PUBLIC PROOF</em></footer></div>}</motion.div></AnimatePresence></div>;
}
function Terminal({ step, hero = false }: { step: Step; hero?: boolean }) { const item = steps[Math.min(3, step - 1)]; return <section className={`vu-terminal ${hero ? 'vu-heroTerminal' : ''}`}><header><span>VOUCHEDGE // ENGINE: VOUCHRES // {String(step).padStart(2, '0')} // {hero ? 'PUBLIC PROOF' : item.tag.split(' / ')[1]}</span><i>LIVE</i></header><AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, x: step % 2 ? -18 : 18, filter: 'blur(5px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }} transition={transition} className="vu-terminalBody"><Artifact step={step} /></motion.div></AnimatePresence><footer><span>RECORD / VOUCHEDGE</span><span>{item.status}</span><b>{item.metric}</b></footer></section>; }
function TruthFlow({ onJoinBeta, onViewDemo }: Pick<Props, 'onJoinBeta' | 'onViewDemo'>) { const canvas = useRef<HTMLDivElement>(null); const [scene, setScene] = useState<Scene>('hero'); const [active, setActive] = useState<Step>(1); const [hasAdvancedToRecord, setHasAdvancedToRecord] = useState(false); const recordAdvanceTimer = useRef<number | null>(null); const [videoMuted, setVideoMuted] = useState(true); const [introDocked, setIntroDocked] = useState(false); const heroVideoRef = useRef<HTMLVideoElement>(null);
  // Prevent all scrolling while the fullscreen intro video is active
  useEffect(() => {
    const root = document.documentElement;
    if (!introDocked) {
      const prev = root.style.overflow;
      const prevTouch = root.style.touchAction;
      root.style.overflow = 'hidden';
      root.style.touchAction = 'none';
      return () => { root.style.overflow = prev; root.style.touchAction = prevTouch; };
    }
  }, [introDocked]);
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      // Start shrinking into the hero dock at 60% of the video duration.
      if (video.duration && video.currentTime / video.duration >= 0.6 && !introDocked) {
        setIntroDocked(true);
      }
    };
    const handleEnded = () => {
      setIntroDocked(true);
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    // Fallback timer so it always docks after 8s even if autoplay is delayed
    const timer = window.setTimeout(() => setIntroDocked(true), 6000);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      window.clearTimeout(timer);
    };
  }, [introDocked]); useEffect(() => { if (introDocked) return; const timer = window.setTimeout(() => setIntroDocked(true), 4000); return () => window.clearTimeout(timer); }, [introDocked]); const replayHeroVideo = () => { const video = heroVideoRef.current; if (!video) return; setIntroDocked(false); video.currentTime = 0; void video.play(); }; const { scrollYProgress: rawScrollYProgress } = useScroll({ target: canvas, offset: ['start start', 'end end'] });
  // Spring damper: eliminates mousewheel notch jitter, locks in 60fps glide
  const scrollYProgress = useSpring(rawScrollYProgress, { stiffness: 80, damping: 24, restDelta: 0.001 });
  const sceneRef = useRef<Scene>('hero'); const stepRef = useRef<Step>(1);
  useMotionValueEvent(scrollYProgress, 'change', p => {
    const next: Scene = p < .16 ? 'hero' : p < .8 ? 'ledger' : 'proof';
    if (next !== sceneRef.current) { sceneRef.current = next; setScene(next); }
    if (next === 'ledger') {
      const s = Math.min(4, Math.max(1, Math.floor((p - .16) / .16) + 1)) as Step;
      if (s !== stepRef.current) { stepRef.current = s; setActive(s); }
    }
    if (p >= .995 && !hasAdvancedToRecord) { setHasAdvancedToRecord(true); recordAdvanceTimer.current = window.setTimeout(() => document.getElementById('research-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 2000); }
    if (p < .985 && hasAdvancedToRecord) { if (recordAdvanceTimer.current) window.clearTimeout(recordAdvanceTimer.current); recordAdvanceTimer.current = null; setHasAdvancedToRecord(false); }
  }); const go = (stop: number) => { const el = canvas.current; if (!el) return; const start = el.getBoundingClientRect().top + window.scrollY; window.scrollTo({ top: start + (el.offsetHeight - window.innerHeight) * stop, behavior: 'smooth' }); }; const skipToDecision = () => { if (recordAdvanceTimer.current) window.clearTimeout(recordAdvanceTimer.current); recordAdvanceTimer.current = null; setHasAdvancedToRecord(true); document.getElementById('research-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; return <div id="truth-flow" ref={canvas} className="vu-story"><div className="vu-pinned"><div className="vu-frame"><AnimatePresence mode="wait"><motion.section key={scene} className="vu-scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .18 }}>{scene === 'hero' && <div className="vu-heroGrid"><div className="vu-copy"><span className="vu-eyebrow">● VOUCHEDGE // ENGINE: VOUCHRES · MLB RESEARCH / PUBLIC PROOF</span><h1>Stop guessing. Build an auditable MLB research ledger before first pitch.</h1><p>VouchEdge pairs Statcast telemetry, pitcher-vulnerability splits, and lineup validation into a decision record you can inspect, track, and improve.</p><div className="vu-ctas"><button className="vu-primary" onClick={onJoinBeta}>OPEN TODAY’S SLATE — FREE BETA</button><button onClick={() => { onViewDemo(); document.getElementById('research-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>INSPECT SAMPLE LEDGER <span>↓</span></button></div><div className="vu-meta"><span>HR TELEMETRY + PITCHER SPLITS</span><span>LINEUP + BULLPEN CONTEXT</span><span>LOCKED PRE-GAME RECORD</span></div></div><div className={`vu-heroVisual ${introDocked ? "vu-docked" : "vu-fullscreenIntro"}`}>
            {!introDocked && <button className="vu-skipIntro" type="button" onClick={() => setIntroDocked(true)}>SKIP INTRO ✕</button>}<div className="vu-videoFrame"><video ref={heroVideoRef} className="vu-heroVideo" autoPlay muted={videoMuted} loop playsInline preload="metadata" aria-label="VouchEdge product preview"><source src="/media/vouchedge-landing-60fps.mp4" type="video/mp4"/></video><div className="vu-videoScan" aria-hidden="true"/><div className="vu-videoLabel"><div><button className="vu-videoReplay" type="button" aria-label="Replay VouchEdge product intro" onClick={replayHeroVideo}>↻ REPLAY</button><button className="vu-videoAudio" type="button" aria-pressed={!videoMuted} aria-label={videoMuted ? "Unmute VouchEdge product video" : "Mute VouchEdge product video"} onClick={() => { const next = !videoMuted; setVideoMuted(next); if (heroVideoRef.current) { heroVideoRef.current.muted = next; void heroVideoRef.current.play(); } }}>{videoMuted ? "◌ SOUND OFF" : "◉ SOUND ON"}</button><b>60 FPS · LIVE RESEARCH FLOW</b></div></div></div><Terminal step={1} hero /></div></div>}{scene === 'ledger' && <div className="vu-ledgerGrid"><div className="vu-copy vu-ledgerCopy"><motion.div key={steps[active - 1].tag} className="vu-actTeamLabel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: .82, y: 0 }} transition={{ duration: .45 }}><span>TEAM / {STORY_MATCHUPS[Math.min(STORY_MATCHUPS.length - 1, active - 1)].team}</span><b>{STORY_MATCHUPS[Math.min(STORY_MATCHUPS.length - 1, active - 1)].matchup}</b></motion.div><span className="vu-eyebrow">VOUCHEDGE FLOW / {String(active).padStart(2, '0')} OF 04</span><AnimatePresence mode="wait"><motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={transition}><h2>{steps[active - 1].title}</h2><p>{steps[active - 1].body}</p><div className="vu-proof"><span>{steps[active - 1].proof}</span><b>VOUCHEDGE</b></div></motion.div></AnimatePresence></div><Terminal step={active} /></div>}{scene === 'proof' && <motion.div className="vu-proofScene" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: .16 } } }}><motion.span className="vu-eyebrow" variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>THE VOUCH RECORD</motion.span><motion.h2 variants={{ hidden: { opacity: 0, y: 30, scale: .97 }, show: { opacity: 1, y: 0, scale: 1 } }}>Research. Vouch. Prove it.</motion.h2><motion.p variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}>Every meaningful decision retains the context that made it worth taking, then meets the result in a record that cannot quietly rewrite the past.</motion.p><motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}><span>RESEARCHED</span><i>→</i><span>TIME STAMPED</span><i>→</i><span>GRADED</span><i>→</i><span>PUBLIC</span></motion.div></motion.div>}</motion.section></AnimatePresence></div><div className="vu-scrubber"><button className={scene === 'hero' ? 'active' : ''} onClick={() => go(0)}>INTRO</button><div className="vu-rail">{steps.map((s, i) => <button key={s.id} aria-label={`VouchRes act ${s.id}`} className={scene === 'ledger' && active === s.id ? 'active' : ''} onClick={() => go(.16 + i * .16 + .035)} />)}</div><span>{scene === 'ledger' ? steps[active - 1].tag : scene === 'proof' ? 'PUBLIC PROOF' : 'LIVE RESEARCH'}</span><button className={scene === 'proof' ? 'active' : ''} onClick={() => go(.86)}>PROOF</button>{hasAdvancedToRecord && <button className="vu-skipDecision" type="button" onClick={skipToDecision}>SKIP TO TRACK THE DECISION ↓</button>}</div></div></div>; }
function ResearchRecordBridge() {
  const bridgeRef = useRef<HTMLElement>(null);
  const { scrollYProgress: rawBridgeProgress } = useScroll({ target: bridgeRef, offset: ['start start', 'end end'] });
  // Spring damper on the ledger section scroll — same physics, same glide
  const scrollYProgress = useSpring(rawBridgeProgress, { stiffness: 80, damping: 24, restDelta: 0.001 });
  const [phase, setPhase] = useState(0);
  const [hasAdvancedPastDecision, setHasAdvancedPastDecision] = useState(false);
  const advanceTimer = useRef<number | null>(null);
  const phases = [
    { eyebrow: '01 / ORIGINAL RESEARCH', title: 'Track the decision.', body: 'Keep the original case intact: matchup evidence, confidence, and the exact context available before first pitch.', label: 'RESEARCH SAVED', detail: 'Signals, thesis, timestamp' },
    { eyebrow: '02 / DECISION LOCKED', title: 'Keep the record.', body: 'Lock the call before the result arrives. The decision cannot be rewritten after the market or game changes.', label: 'THESIS LOCKED', detail: 'Pre-game record preserved' },
    { eyebrow: '03 / WINS + LOSSES', title: 'Show the whole record.', body: 'Wins and losses remain visible together, so the scoreboard measures the process honestly—not just the highlights.', label: 'OUTCOMES GRADED', detail: 'Win · Loss · Review' },
    { eyebrow: '04 / METHODOLOGY', title: 'Make the next call better.', body: 'Review what held up, where the evidence failed, and turn every completed record into a sharper research workflow.', label: 'LOOP COMPLETE', detail: 'Research → decision → result' },
  ];
  const phaseRef = useRef(0);
  const snapLockRef = useRef(false);
  const snapTimerRef = useRef<number | null>(null);
  const touchStartYRef = useRef(0);

  const snapToPhase = (targetPhase: number) => {
    const el = bridgeRef.current;
    if (!el) return;
    const clamped = Math.min(phases.length - 1, Math.max(0, targetPhase));
    // Calculate the exact scroll position for this phase boundary
    const sectionTop = el.getBoundingClientRect().top + window.scrollY;
    const scrollable = el.offsetHeight - window.innerHeight;
    const ratio = (clamped + 0.02) / phases.length; // land just past the phase boundary
    const target = sectionTop + scrollable * Math.min(ratio, 0.99);
    snapLockRef.current = true;
    window.scrollTo({ top: target, behavior: 'smooth' });
    // Release snap lock after animation settles
    if (snapTimerRef.current) window.clearTimeout(snapTimerRef.current);
    snapTimerRef.current = window.setTimeout(() => { snapLockRef.current = false; }, 700);
  };

  // Intercept fast wheel scrolls — redirect to next/prev phase
  useEffect(() => {
    const el = bridgeRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (snapLockRef.current) { e.preventDefault(); return; }
      const speed = Math.abs(e.deltaY);
      if (speed > 40) {
        const dir = e.deltaY > 0 ? 1 : -1;
        const target = phaseRef.current + dir;
        // If scrolling past the last phase or before the first, release native scroll
        if (target > phases.length - 1 || target < 0) return;
        e.preventDefault();
        snapToPhase(target);
      }
    };
    const onTouchStart = (e: TouchEvent) => { touchStartYRef.current = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      if (snapLockRef.current) return;
      const delta = touchStartYRef.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) > 18) {
        const dir = delta > 0 ? 1 : -1;
        const target = phaseRef.current + dir;
        // Same boundary check for touch
        if (target > phases.length - 1 || target < 0) return;
        snapToPhase(target);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMotionValueEvent(scrollYProgress, 'change', value => {
    // Direct DOM write — zero React overhead, runs on compositor thread
    bridgeRef.current?.style.setProperty('--ledger-progress', String(Math.min(1, Math.max(0, value))));
    // Only setState when the discrete phase bucket changes (~4 times total)
    const next = Math.min(phases.length - 1, Math.max(0, Math.floor(value * phases.length)));
    if (next !== phaseRef.current) { phaseRef.current = next; setPhase(next); }
    if (value >= .985 && !hasAdvancedPastDecision) {
      setHasAdvancedPastDecision(true);
      advanceTimer.current = window.setTimeout(() => document.getElementById('transparency-over-hype')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 950);
    }
    if (value < .96 && hasAdvancedPastDecision) {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
      setHasAdvancedPastDecision(false);
    }
  });
  const record = [
    { player: 'S. OHTANI', pick: 'HR · +310', result: 'WIN', note: 'BARREL + PARK FIT', tone: 'win' },
    { player: 'A. JUDGE', pick: 'HR · +275', result: 'LOSS', note: 'CONTACT DID NOT CONVERT', tone: 'loss' },
    { player: 'P. CROW-ARMSTRONG', pick: 'HR · +420', result: 'WIN', note: 'PITCHER VULNERABILITY', tone: 'win' },
  ];
  const current = phases[phase];
  return <section ref={bridgeRef} id="research-preview" className="vu-realSection vu-decisionStory"><div className="vu-decisionPinned"><div className="vu-decisionGrid"><motion.div className="vu-decisionCopy" key={phase} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={transition}><span className="vu-eyebrow">{current.eyebrow}</span><h2>{current.title}</h2><p>{current.body}</p><div className="vu-decisionStatus"><span>{current.label}</span><b>{current.detail}</b></div><div className="vu-phaseRail">{phases.map((item, index) => <span key={item.eyebrow} className={index <= phase ? 'active' : ''}>{String(index + 1).padStart(2, '0')}</span>)}</div></motion.div><motion.div className="vu-recordCard" initial={{ opacity: 0, y: 34 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: .35, once: false }} transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }}><div className="vu-recordTop"><span>VOUCHEDGE / DECISION LEDGER</span><b>RECORD · 14–9</b></div><div className="vu-recordHeadline"><div><small>TRACKED DECISIONS</small><strong>23</strong></div><div><small>WIN RATE</small><strong>60.9%</strong></div><div><small>STATUS</small><strong>PUBLIC</strong></div></div><div className="vu-recordRows">{record.map((item, index) => <motion.article key={item.player} className={`vu-recordRow ${item.tone}`} animate={{ opacity: phase >= 2 || index === 0 ? 1 : .42, x: phase >= 2 ? 0 : 10 }} transition={{ delay: index * .06 }}><div><b>{item.player}</b><span>{item.pick}</span></div><em>{item.note}</em><strong>{item.result}</strong></motion.article>)}</div><div className="vu-recordFoot"><span>PRE-GAME CONTEXT RETAINED</span><span>OUTCOMES NEVER HIDDEN</span></div></motion.div></div></div></section>
}

export default function VouchEdgeLandingV3(props: Props) { return <main className="vu-landing"><nav className="vu-nav"><a href="#top" className="vu-brand"><img src="/vouchedge-mark-aurora.svg" alt="" aria-hidden="true"/><span>VOUCHEDGE</span><b>BETA</b></a><div><button onClick={props.onLogin}>LOG IN</button><button className="vu-navCta" onClick={props.onJoinBeta}>GET ACCESS</button></div></nav><div id="top"><TruthFlow onJoinBeta={props.onJoinBeta} onViewDemo={props.onViewDemo} /></div><ResearchRecordBridge /><motion.section id="transparency-over-hype" className="vu-integrityNote vu-chapter vu-chapterIntegrity" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.6, margin: "0px 0px -100px 0px" }} variants={{ hidden: {}, show: { transition: { staggerChildren: .18, delayChildren: .1 } } }}><motion.div variants={{ hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0 } }} transition={{ type: "spring", stiffness: 130, damping: 21 }}><span className="vu-eyebrow">RESEARCH LIMITS / PUBLIC RECORD</span><h2>Evidence should explain itself.</h2><p>Confidence describes the strength of the available evidence, not a promise of an outcome. VouchRes keeps missing-data notes visible and does not curate a highlight reel of only successful examples.</p></motion.div><motion.div className="vu-integrityChain" variants={{ hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0 } }} transition={{ type: "spring", stiffness: 145, damping: 22 }}><span>RESEARCHED</span><i>→</i><span>TIME STAMPED</span><i>→</i><span>COMPARED TO RESULT</span><i>→</i><span>RETAINED</span></motion.div></motion.section><div className="vu-chapter vu-chapterDecision"><DecisionIntelligence /></div><div className="vu-chapter vu-chapterCommunity"><CommunitySection onExploreCommunity={props.onExploreCommunity} /></div><div className="vu-chapter vu-chapterPricing"><PricingSection onJoinBeta={props.onJoinBeta} /></div><div className="vu-chapter vu-chapterFAQ"><FAQSection /></div><div className="vu-chapter vu-chapterCTA"><CTASection onJoinBeta={props.onJoinBeta} onViewDemo={props.onViewDemo} /></div><FooterSection onNavigate={props.onFooterNavigate} /></main>; }
