import '../styles/vouchres-ultimate-truth-landing.css';
import '../styles/public-landing.css';
import '../styles/vouchedge-mobile-story.css';
import '../components/landing-v4/evidence-field.css';
import '../components/landing-v4/premium-hero.css';
import { motion, useMotionValueEvent, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { useRef, useState, useCallback } from 'react';
import {
  EvidenceIntegrityJourney,
  CommunitySection,
  PricingSection,
  FAQSection,
  CTASection,
  FooterSection,
  type FooterNavigationTarget,
} from '../components/landing-v3';

import {
  useResearchPreview,
} from '../components/landing-v3/researchPreviewData';

type StoryStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type Props = {
  onLogin: () => void;
  onJoinBeta: () => void;
  onViewDemo: () => void;
  onExploreCommunity: () => void;
  onFooterNavigate: (target: FooterNavigationTarget) => void;
};

const storySteps = [
  {
    id: 1 as StoryStep,
    tag: '01 / MATCHUP',
    title: 'See the matchup before the noise.',
    body: 'Start with the player, opponent, game state, and the research inputs that actually exist.',
    status: 'MATCHUP',
  },
  {
    id: 2 as StoryStep,
    tag: '02 / EVIDENCE',
    title: 'See what the system knows.',
    body: 'Every signal keeps its source. Verified inputs stay verified. Missing inputs stay visibly missing.',
    status: 'EVIDENCE',
  },
  {
    id: 3 as StoryStep,
    tag: '03 / CONTEXT',
    title: 'Context changes the meaning of a signal.',
    body: 'Pitcher vulnerability, lineup state, recent form, environment, and availability belong beside the metric—not buried behind it.',
    status: 'CONTEXT',
  },
  {
    id: 4 as StoryStep,
    tag: '04 / CONFIDENCE',
    title: 'Confidence should be explainable.',
    body: 'Confidence rises with evidence quality and coverage. It should never become a substitute for the evidence underneath it.',
    status: 'WHY',
  },
  {
    id: 5 as StoryStep,
    tag: '05 / DECISION',
    title: 'Make the call while it can still be tested.',
    body: 'Turn the research into a clear pre-game thesis while the outcome is still unknown.',
    status: 'DECISION',
  },
  {
    id: 6 as StoryStep,
    tag: '06 / LOCK',
    title: 'Keep the record.',
    body: 'Sources, evidence state, confidence, and thesis stay attached to the moment the decision was made.',
    status: 'LOCKED',
  },
  {
    id: 7 as StoryStep,
    tag: '07 / RESULT',
    title: 'The result is not the whole story.',
    body: 'Put the outcome beside the original decision. Keep what worked, what failed, and what the evidence actually supported.',
    status: 'AUDIT',
  },
  {
    id: 8 as StoryStep,
    tag: '08 / LEARN',
    title: 'Every slate should teach the next one.',
    body: 'Build a decision history that exposes patterns across wins, losses, confidence, and evidence quality.',
    status: 'LEARN',
  },
] as const;

function mlbHeadshot(personId?: number) {
  return personId
    ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_160,q_auto:best/v1/people/${personId}/headshot/67/current`
    : '/vouchedge-mark-aurora.svg';
}

function displayTeam(team?: string) {
  if (!team) return 'TEAM PENDING';
  if (team === 'LAA') return 'ANGELS';
  if (team === 'LAD') return 'DODGERS';
  return team;
}

function formatConfidence(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value <= 1
      ? `${Math.round(value * 100)}%`
      : `${Math.round(value)}%`;
  }

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return '—';
}

function storyPhaseLabel(story: StoryStep) {
  switch (story) {
    case 1:
      return 'LOCATE';
    case 2:
      return 'CONNECT';
    case 3:
      return 'ORGANIZE';
    case 4:
      return 'RESOLVE';
    case 5:
      return 'DECIDE';
    case 6:
      return 'LOCK';
    case 7:
      return 'COMPARE';
    case 8:
      return 'LEARN';
  }
}

function TacticalHUDTelemetry({
  preview,
  story,
}: {
  preview: ReturnType<typeof useResearchPreview>;
  story: StoryStep;
}) {
  const player = preview.primaryPlayer;
  const confidenceValue = formatConfidence(player?.dataConfidence);
  const availableEvidenceCount = preview.evidenceItems.filter((item) => item.state === 'available').length;

  switch (story) {
    case 1:
      return (
        <div className="border border-white/15 bg-zinc-950 p-4 space-y-3">
          <div className="flex items-center justify-between font-mono text-[9px] text-zinc-400 border-b border-white/10 pb-2">
            <span className="text-cyan-400 font-bold uppercase tracking-widest">PHASE 01 // MATCHUP LOCATOR</span>
            <span>{preview.statusLabel || 'RESEARCH STATE'}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="border border-white/10 bg-black p-2.5">
              <span className="text-[9px] text-zinc-500 block">GAME MATCHUP</span>
              <strong className="text-white text-[13px] font-bold block mt-1">
                {preview.featuredGame ? `${preview.featuredGame.awayTeam} @ ${preview.featuredGame.homeTeam}` : 'MLB MATCHUP PENDING'}
              </strong>
            </div>
            <div className="border border-white/10 bg-black p-2.5">
              <span className="text-[9px] text-zinc-500 block">VENUE & STATE</span>
              <strong className="text-white text-[13px] font-bold block mt-1 truncate">
                {preview.featuredGame?.venue || 'VENUE PENDING'}
              </strong>
            </div>
          </div>
          <p className="font-mono text-[10px] text-zinc-400 m-0">
            ✓ SCHEDULE-BACKED · NO SYNTHETIC GAMES · NO INVENTED PICKS
          </p>
        </div>
      );

    case 2:
      return (
        <div className="border border-white/15 bg-zinc-950 p-4 space-y-3">
          <div className="flex items-center justify-between font-mono text-[9px] text-zinc-400 border-b border-white/10 pb-2">
            <span className="text-cyan-400 font-bold uppercase tracking-widest">PHASE 02 // EVIDENCE AUDIT</span>
            <span>4 INPUT LAYERS</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {preview.evidenceItems.slice(0, 4).map((item) => (
              <div key={item.label} className="border border-white/10 bg-black p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-zinc-500">{item.label}</span>
                  <span className={`text-[7px] px-1 py-0.2 border ${
                    item.state === 'available' ? 'border-emerald-400/40 text-emerald-300' :
                    item.state === 'partial' ? 'border-amber-400/40 text-amber-300' : 'border-zinc-700 text-zinc-500'
                  }`}>
                    {item.state.toUpperCase()}
                  </span>
                </div>
                <strong className="text-white text-[11px] font-bold block mt-1 truncate">
                  {item.detail || 'NO VALUE'}
                </strong>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-zinc-400 m-0">
            MISSING DATA STAYS VISIBLY MISSING · UNVERIFIED GAPS FLAGGED
          </p>
        </div>
      );

    case 3:
      return (
        <div className="border border-white/15 bg-zinc-950 p-4 space-y-3">
          <div className="flex items-center justify-between font-mono text-[9px] text-zinc-400 border-b border-white/10 pb-2">
            <span className="text-cyan-400 font-bold uppercase tracking-widest">PHASE 03 // CONTEXT MATRIX</span>
            <span>ENVIRONMENTAL FACTORS</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="border border-white/10 bg-black p-2.5">
              <span className="text-[8px] text-zinc-500 block">HIT POWER</span>
              <strong className="text-white text-base font-bold block mt-0.5">
                {player?.hitterPower != null ? `${Math.round(player.hitterPower)}%` : '—'}
              </strong>
            </div>
            <div className="border border-white/10 bg-black p-2.5">
              <span className="text-[8px] text-zinc-500 block">PITCH VULN</span>
              <strong className="text-amber-300 text-base font-bold block mt-0.5">
                {player?.pitcherVulnerability != null ? `${Math.round(player.pitcherVulnerability)}%` : '—'}
              </strong>
            </div>
            <div className="border border-white/10 bg-black p-2.5">
              <span className="text-[8px] text-zinc-500 block">PARK FACTOR</span>
              <strong className="text-emerald-300 text-base font-bold block mt-0.5">
                {player?.parkFactor != null ? Math.round(player.parkFactor) : '—'}
              </strong>
            </div>
          </div>
          <p className="font-mono text-[10px] text-zinc-400 m-0">
            VULNERABILITY & ENVIRONMENT LIVE BESIDE THE METRIC
          </p>
        </div>
      );

    case 4:
      return (
        <div className="border border-white/15 bg-zinc-950 p-4 space-y-3">
          <div className="flex items-center justify-between font-mono text-[9px] text-zinc-400 border-b border-white/10 pb-2">
            <span className="text-cyan-400 font-bold uppercase tracking-widest">PHASE 04 // EXPLAINABLE CONFIDENCE</span>
            <span>STRENGTH OF EVIDENCE</span>
          </div>
          <div className="flex items-center justify-between gap-4 border border-white/10 bg-black p-3.5">
            <div>
              <span className="text-[9px] font-mono text-zinc-400 block">DATA CONFIDENCE GAUGE</span>
              <strong className="text-white font-mono text-2xl font-black block mt-0.5">
                {confidenceValue}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-mono text-emerald-300 border border-emerald-400/30 bg-emerald-950/40 px-2 py-1 uppercase tracking-widest">
                {availableEvidenceCount > 0 ? 'AVAILABLE SUPPORT' : 'SUPPORT PENDING'}
              </span>
              <span className="text-[9px] font-mono text-zinc-500 block mt-1.5">
                {availableEvidenceCount} OF {preview.evidenceItems.length} INPUTS AVAILABLE
              </span>
            </div>
          </div>
          <p className="font-mono text-[10px] text-zinc-400 m-0">
            CONFIDENCE REPRESENTS EVIDENCE DEPTH · NOT A GUARANTEE OF OUTCOME
          </p>
        </div>
      );

    case 5:
      return (
        <div className="border border-white/15 bg-zinc-950 p-4 space-y-3">
          <div className="flex items-center justify-between font-mono text-[9px] text-zinc-400 border-b border-white/10 pb-2">
            <span className="text-cyan-400 font-bold uppercase tracking-widest">PHASE 05 // PRE-PITCH THESIS</span>
            <span>ACTIVE HYPOTHESIS</span>
          </div>
          <div className="border border-white/10 bg-black p-3.5 space-y-2">
            <div className="flex justify-between font-mono text-[10px]">
              <span className="text-zinc-400">PLAYER THESIS:</span>
              <strong className="text-white">{player?.playerName || 'PLAYER PENDING'} · NO THESIS RECORDED</strong>
            </div>
            <div className="flex justify-between font-mono text-[10px]">
              <span className="text-zinc-400">TARGET VULNERABILITY:</span>
              <span className="text-amber-300 font-bold">NOT PROVIDED BY LANDING FEED</span>
            </div>
            <div className="flex justify-between font-mono text-[10px] border-t border-white/10 pt-1.5">
              <span className="text-zinc-500">STATE:</span>
              <span className="text-cyan-300 font-bold">WORKFLOW PREVIEW · NOT A SAVED DECISION</span>
            </div>
          </div>
          <p className="font-mono text-[10px] text-zinc-400 m-0">
            SAVE A DECISION IN THE APP TO CREATE A PRE-GAME RECORD
          </p>
        </div>
      );

    case 6:
      return (
        <div className="border border-white/15 bg-zinc-950 p-4 space-y-3">
          <div className="flex items-center justify-between font-mono text-[9px] text-zinc-400 border-b border-white/10 pb-2">
            <span className="text-emerald-400 font-bold uppercase tracking-widest">PHASE 06 // RECORD WORKFLOW</span>
            <span>RECORD STATE</span>
          </div>
          <div className="border border-emerald-400/30 bg-black p-3.5 space-y-2">
            <div className="flex justify-between font-mono text-[10px]">
              <span className="text-zinc-400">RECORD TIMESTAMP:</span>
              <strong className="text-zinc-300">NOT CREATED IN LANDING PREVIEW</strong>
            </div>
            <div className="flex justify-between font-mono text-[10px]">
              <span className="text-zinc-400">SECURITY PROTOCOL:</span>
              <span className="text-white font-bold">NO SAVED RECORD</span>
            </div>
            <div className="font-mono text-[9px] text-zinc-500 border-t border-white/10 pt-1.5">
              SIGN IN AND SAVE A DECISION TO USE THE RECORD WORKFLOW
            </div>
          </div>
          <p className="font-mono text-[10px] text-emerald-300 m-0">
            LANDING PREVIEW DOES NOT CLAIM A RECORD WAS SEALED
          </p>
        </div>
      );

    case 7:
      return (
        <div className="border border-white/15 bg-zinc-950 p-4 space-y-3">
          <div className="flex items-center justify-between font-mono text-[9px] text-zinc-400 border-b border-white/10 pb-2">
            <span className="text-cyan-400 font-bold uppercase tracking-widest">PHASE 07 // REALITY AUDIT</span>
            <span>POST-GAME TRUTH</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="border border-white/10 bg-black p-2.5">
              <span className="text-[8px] text-zinc-500 block">ORIGINAL THESIS</span>
              <strong className="text-white text-[11px] block mt-1">HR Index {typeof player?.hrScore === 'number' ? Math.round(player.hrScore) : '—'}</strong>
              <span className="text-[8px] text-cyan-300 block mt-0.5">Confidence {confidenceValue}</span>
            </div>
            <div className="border border-emerald-400/30 bg-black p-2.5">
              <span className="text-[8px] text-emerald-400 block">FINAL OUTCOME</span>
              <strong className="text-zinc-300 text-[11px] block mt-1">OUTCOME NOT LOADED</strong>
              <span className="text-[8px] text-zinc-500 block mt-0.5">NO RESULT CLAIMED</span>
            </div>
          </div>
          <p className="font-mono text-[10px] text-zinc-400 m-0">
            SAVED RECORDS CAN BE COMPARED WITH RESULTS AFTER THEY ARRIVE
          </p>
        </div>
      );

    case 8:
      return (
        <div className="border border-neutral-800/80 bg-zinc-950 p-3 space-y-2.5 sm:border-white/15 sm:p-4 sm:space-y-3">
          <div className="flex items-center justify-between gap-3 font-mono text-[10px] sm:text-xs text-zinc-400 border-b border-white/10 pb-2">
            <span className="min-w-0 break-words text-cyan-400 font-bold uppercase tracking-wider">PHASE 08 // MODEL LEARNING</span>
            <span className="hidden shrink-0 sm:inline">REVIEW WORKFLOW</span>
          </div>
          <div className="border border-neutral-800/80 bg-black px-3 py-2 font-mono text-xs">
            <div className="flex items-center justify-between gap-3 py-1 text-zinc-300">
              <span className="min-w-0 break-words">SAVED DECISION HISTORY</span>
              <span className="shrink-0 text-zinc-500 font-bold">NOT LOADED</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 py-1 text-zinc-300">
              <span className="min-w-0 break-words">POST-GAME REVIEW</span>
              <span className="shrink-0 text-zinc-500 font-bold">PENDING A SAVED RECORD</span>
            </div>
          </div>
          <p className="font-mono text-[10px] text-zinc-400 m-0">
            WINS AND LOSSES SHOULD RECEIVE EQUAL REVIEW WEIGHT
          </p>
        </div>
      );
  }
}

function TruthFlow({
  onJoinBeta,
  onViewDemo,
}: Pick<Props, 'onJoinBeta' | 'onViewDemo'>) {
  const canvas = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  const preview = useResearchPreview();
  const player = preview.primaryPlayer;
  const playerId = Number(player?.playerId);
  const validPlayerId = Number.isFinite(playerId) ? playerId : undefined;

  const [activeStory, setActiveStory] = useState<StoryStep>(1);
  const [videoMuted, setVideoMuted] = useState(true);
  const mobilePipeline = useRef<HTMLElement>(null);

  const replayHeroVideo = () => {
    const video = heroVideoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play();
  };

  const { scrollYProgress: rawScrollYProgress } = useScroll({
    target: canvas,
    offset: ['start start', 'end end'],
  });

  const scrollYProgress = useSpring(rawScrollYProgress, {
    stiffness: 260,
    damping: 34,
    mass: 0.6,
    restDelta: 0.0001,
  });

  const activeStoryRef = useRef<StoryStep>(1);

  const { scrollYProgress: mobileScrollYProgress } = useScroll({
    target: mobilePipeline,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) return;
    const normalized = Math.min(1, Math.max(0, (progress - 0.05) / 0.90));
    const nextStory = Math.min(8, Math.max(1, Math.floor(normalized * 8) + 1)) as StoryStep;

    if (nextStory !== activeStoryRef.current) {
      activeStoryRef.current = nextStory;
      setActiveStory(nextStory);
    }
  });

  useMotionValueEvent(mobileScrollYProgress, 'change', (progress) => {
    if (typeof window === 'undefined' || !window.matchMedia('(max-width: 767px)').matches) return;
    const normalizedProgress = Math.min(1, Math.max(0, progress));
    const nextStory = Math.min(8, Math.floor(normalizedProgress * 8) + 1) as StoryStep;
    if (nextStory !== activeStoryRef.current) {
      activeStoryRef.current = nextStory;
      setActiveStory(nextStory);
    }
  });

  const goToStory = useCallback((story: StoryStep) => {
    const el = canvas.current;
    if (!el) return;

    const start = el.getBoundingClientRect().top + window.scrollY;
    const usableScroll = el.offsetHeight - window.innerHeight;
    const targetProgress = 0.05 + ((story - 1) / 7) * 0.90;

    window.scrollTo({
      top: start + usableScroll * targetProgress,
      behavior: 'smooth',
    });
  }, []);

  const currentStory = storySteps[activeStory - 1];

  const bullpenEvidence = preview.evidenceItems.find((item) => item.label.toLowerCase().includes('bullpen'));
  const weatherEvidence = preview.evidenceItems.find((item) => item.label.toLowerCase() === 'weather');

  const mobileMetric = (value: number | null | undefined) =>
    typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : '—';

  return (
    <div id="truth-flow" className="bg-black text-white">
      <section className="relative flex flex-col justify-between h-[100dvh] w-full px-4 pt-14 pb-3 overflow-hidden bg-black md:hidden md:h-auto md:overflow-visible">
        <header className="shrink-0 border-b border-zinc-800 pb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            VOUCHEDGE // {currentStory.tag}
          </span>
          <h1 className="mt-1 break-words text-xl font-black leading-tight tracking-tight text-white">
            {currentStory.title}
          </h1>
          <p className="mt-1 max-h-10 overflow-hidden text-xs font-medium leading-relaxed text-zinc-300">
            {currentStory.body}
          </p>
        </header>

        <section aria-label="Context Matrix" className="shrink-0 py-2">
          <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-zinc-500">
            <span>Context Matrix</span>
            <span>{preview.statusLabel || 'Research state'}</span>
          </div>
          <div className="grid grid-cols-3 gap-px border border-zinc-800 bg-zinc-800 font-mono text-[9px]">
            <div className="min-w-0 bg-black px-2 py-1.5">
              <span className="block truncate uppercase leading-none tracking-wider text-zinc-400">Hit power</span>
              <strong className="mt-1 block truncate text-sm font-bold leading-none text-white">{mobileMetric(player?.hitterPower)}</strong>
            </div>
            <div className="min-w-0 bg-black px-2 py-1.5">
              <span className="block truncate uppercase leading-none tracking-wider text-zinc-400">Pitch vuln</span>
              <strong className="mt-1 block truncate text-sm font-bold leading-none text-amber-300">{mobileMetric(player?.pitcherVulnerability)}</strong>
            </div>
            <div className="min-w-0 bg-black px-2 py-1.5">
              <span className="block truncate uppercase leading-none tracking-wider text-zinc-400">Park factor</span>
              <strong className="mt-1 block truncate text-sm font-bold leading-none text-emerald-300">{mobileMetric(player?.parkFactor)}</strong>
            </div>
          </div>
        </section>

        <div className="flex-1 min-h-0 relative w-full my-2 border border-zinc-800 bg-black overflow-hidden">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/media/optimized/vouchedge-landing-poster.jpg"
            aria-label="VouchEdge optical telemetry feed"
          >
            <source src="/media/vouchedge-landing-60fps.mp4" type="video/mp4" />
            <source src="/media/optimized/vouchedge-landing-desktop.mp4" type="video/mp4" />
          </video>
          <div aria-hidden="true" className="ve-optical-reticle pointer-events-none absolute inset-0 z-[2]">
            <span className="absolute inset-x-0 top-1/2 border-t border-emerald-400/15" />
            <span className="absolute inset-y-0 left-1/2 border-l border-emerald-400/15" />
            <span className="absolute left-2 top-2 h-3 w-3 border-l border-t border-emerald-400/70" />
            <span className="absolute right-2 top-2 h-3 w-3 border-r border-t border-emerald-400/70" />
            <span className="absolute bottom-7 left-2 h-3 w-3 border-b border-l border-emerald-400/70" />
            <span className="absolute bottom-7 right-2 h-3 w-3 border-b border-r border-emerald-400/70" />
            <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 border border-emerald-400/50" />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.045)_0px,rgba(255,255,255,0.045)_1px,transparent_1px,transparent_4px)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 border-t border-zinc-800 bg-black/85 px-2 py-1 font-mono text-[9px] uppercase tracking-wider">
            <span className="min-w-0 truncate text-emerald-400">Optical telemetry [60fps]</span>
            <span className="shrink-0 text-zinc-500">0{activeStory} // {storyPhaseLabel(activeStory)}</span>
          </div>
        </div>

        <div className="relative mb-3 h-14 shrink-0 border border-zinc-800 bg-zinc-950 px-2.5">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-emerald-400" />
          <div className="flex h-full min-w-0 items-center justify-between gap-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden border border-zinc-700 bg-black">
                <img
                  src={mlbHeadshot(validPlayerId)}
                  alt=""
                  className="h-full w-full scale-110 object-cover object-top"
                />
              </div>
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 truncate font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-emerald-400" />
                  Player dossier
                </span>
                <strong className="block truncate text-sm font-bold text-white">{player?.playerName || 'Player unavailable'}</strong>
                <span className="block truncate font-mono text-[9px] text-zinc-400">
                  {displayTeam(player?.team)} vs {player?.opponent || 'opponent pending'}
                </span>
              </div>
            </div>
            <div className="shrink-0 border-l border-zinc-800 pl-2.5 text-right">
              <span className="block font-mono text-[9px] uppercase tracking-wider text-zinc-400">HR index</span>
              <strong className="block font-mono text-lg font-black leading-none text-emerald-300">
                {typeof player?.hrScore === 'number' ? Math.round(player.hrScore) : '—'}
              </strong>
              <span className="block font-mono text-[9px] font-bold text-cyan-300">CONF {formatConfidence(player?.dataConfidence)}</span>
            </div>
          </div>
        </div>

        <nav aria-label="Story steps" className="hidden md:flex">
          {storySteps.map((story) => (
            <button key={story.id} type="button" onClick={() => goToStory(story.id)}>
              0{story.id} {storyPhaseLabel(story.id)}
            </button>
          ))}
        </nav>

        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 text-[10px] font-mono font-bold leading-none text-emerald-300/90 animate-pulse text-center">
          Scroll // enter pipeline ↓
        </div>
      </section>

      <section ref={mobilePipeline} className="relative h-[900dvh] w-full border-t border-zinc-800 bg-black md:hidden" aria-labelledby="mobile-truth-pipeline-title">
        <div aria-hidden="true" className="mobile-phase-snap-rail pointer-events-none absolute inset-x-0 top-0 flex h-[800dvh] flex-col">
          {storySteps.map((story) => (
            <span key={story.id} className="h-[100dvh] shrink-0 snap-start" />
          ))}
        </div>
        <div className="sticky top-14 flex h-[calc(100dvh-56px)] w-full flex-col overflow-hidden bg-black px-4 py-6">
          <header className="shrink-0 border-b border-zinc-800 pb-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">Stage 02 // Decision pipeline</span>
            <h2 id="mobile-truth-pipeline-title" className="mt-1 text-lg font-black text-white">One record. Eight connected phases.</h2>
          </header>

          <div className="flex min-h-0 flex-1 items-center gap-4 py-5">
            <nav aria-label="Narrative phase progress" className="flex h-[62%] shrink-0 flex-col justify-between border-l border-zinc-800 pl-3">
              {storySteps.map((story) => {
                const isActive = activeStory === story.id;
                return (
                  <span
                    key={story.id}
                    aria-current={isActive ? 'step' : undefined}
                    className="relative flex h-4 items-center font-mono text-[8px] text-zinc-600"
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute -left-[17px] h-2.5 w-2.5 border border-emerald-400 ${isActive ? 'bg-emerald-400' : 'bg-black'}`}
                    />
                    <span className={isActive ? 'font-bold text-emerald-400' : ''}>0{story.id}</span>
                  </span>
                );
              })}
            </nav>

            <motion.article
              key={activeStory}
              initial={{ opacity: 0.65, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
              aria-live="polite"
              className="min-w-0 flex-1 break-words border border-zinc-800 bg-black p-4"
            >
                <span className="font-mono text-[10px] text-emerald-400 font-bold tracking-wider">
                  0{activeStory} {storyPhaseLabel(activeStory)}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{currentStory.title}</h3>
                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{currentStory.body}</p>

                {activeStory === 3 ? (
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="border border-zinc-800 bg-zinc-950 p-2 text-[10px] font-mono flex justify-between gap-3">
                      <span className="text-zinc-500">BULLPEN LAYER</span>
                      <strong className="shrink-0 text-zinc-200">{bullpenEvidence?.state.toUpperCase() || 'UNAVAILABLE'}</strong>
                    </div>
                    <div className="border border-zinc-800 bg-zinc-950 p-2 text-[10px] font-mono flex justify-between gap-3">
                      <span className="text-zinc-500">WEATHER</span>
                      <strong className="shrink-0 text-zinc-200">{weatherEvidence?.state.toUpperCase() || 'UNAVAILABLE'}</strong>
                    </div>
                  </div>
                ) : null}
            </motion.article>
          </div>

          <footer className="flex shrink-0 items-center justify-between border-t border-zinc-800 pt-3 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            <span>0{activeStory} / 08</span>
            <span className="animate-pulse">{activeStory === 8 ? 'Story complete // continue ↓' : 'Scroll to advance ↓'}</span>
          </footer>
        </div>
      </section>

      <div ref={canvas} className="relative hidden min-h-[420vh] bg-black text-white md:block">
      <div className="sticky top-16 h-[calc(100dvh-64px)] overflow-y-auto bg-black flex flex-col justify-between p-6 lg:overflow-hidden lg:p-8">

        {/* TOP TELEMETRY STATUS BAR */}
        <header className="flex items-center justify-between gap-2 border border-neutral-800/80 bg-zinc-950 px-3 py-2 font-mono text-[10px] uppercase tracking-wider shrink-0 sm:px-4 sm:py-2.5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <span className="h-2 w-2 rounded-none bg-emerald-400 animate-pulse" />
            <span className="truncate text-white font-bold tracking-widest">VOUCHEDGE // HUD</span>
            <span className="hidden text-zinc-500 sm:inline">|</span>
            <span className="hidden text-cyan-300 font-bold sm:inline">{currentStory.tag}</span>
          </div>

          <div className="flex shrink-0 items-center gap-2 text-zinc-400 sm:gap-4">
            <span>PHASE: <strong className="text-white">{storyPhaseLabel(activeStory)}</strong></span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline text-zinc-300">{preview.statusLabel || 'RESEARCH STATE'}</span>
          </div>
        </header>

        {/* MAIN TACTICAL HUD WORKSPACE */}
        <div className="my-auto py-3 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center max-w-7xl mx-auto w-full sm:py-4">

          {/* LEFT COLUMN: Narrative & Active Phase Telemetry */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-3 sm:space-y-4">
            <span className="font-mono text-[10px] sm:text-xs lg:text-sm font-black uppercase tracking-wider sm:tracking-[0.25em] text-cyan-400 block">
              VOUCHEDGE / {currentStory.tag}
            </span>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="space-y-2 sm:space-y-4"
              >
                <h1 className="break-words text-2xl sm:text-5xl lg:text-6xl xl:text-[68px] font-black text-white leading-tight sm:leading-[0.96] tracking-tight sm:tracking-[-0.045em] text-balance m-0">
                  {currentStory.title}
                </h1>
                <p className="text-zinc-200 text-sm sm:text-lg lg:text-xl leading-relaxed m-0 font-normal">
                  {currentStory.body}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Step-Specific Active Telemetry Dossier */}
            <div className="pt-2">
              <TacticalHUDTelemetry preview={preview} story={activeStory} />
            </div>

            {/* CTAs on Phase 1 */}
            {activeStory === 1 ? (
              <div className="flex flex-wrap gap-2 pt-1 sm:gap-4 sm:pt-2">
                <button
                  type="button"
                  onClick={onJoinBeta}
                  className="rounded-none border border-white bg-white px-4 py-2.5 font-mono text-xs sm:border-2 sm:px-8 sm:py-4 sm:text-base font-black uppercase tracking-wider text-black transition hover:bg-zinc-200 cursor-pointer"
                >
                  GET BETA ACCESS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onViewDemo();
                    goToStory(2);
                  }}
                  className="rounded-none border border-white/30 bg-black px-4 py-2.5 font-mono text-xs sm:border-2 sm:px-8 sm:py-4 sm:text-base font-bold uppercase tracking-wider text-white transition hover:border-white hover:bg-white/10 cursor-pointer"
                >
                  EXPLORE EVIDENCE ↓
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 font-mono text-xs text-zinc-300 font-bold">
                <span>STEP {activeStory} OF 8</span>
                <span>·</span>
                <span className="text-cyan-300 uppercase tracking-widest">{storyPhaseLabel(activeStory)} MODE ACTIVE</span>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Hardware Instrument & Film Viewport */}
          <div className="lg:col-span-7 flex flex-col space-y-4">

            {/* Split Screen Hardware Console */}
            <div className="border border-neutral-800/80 bg-zinc-950 shadow-2xl overflow-hidden sm:border-white/20">

              {/* Product Film Top Viewport */}
              <div className="relative aspect-video w-full bg-black border-b border-white/15 overflow-hidden">
                <video
                  ref={heroVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted={videoMuted}
                  loop
                  playsInline
                  preload="metadata"
                  poster="/media/optimized/vouchedge-landing-poster.jpg"
                  aria-label="VouchEdge product film"
                >
                  <source src="/media/vouchedge-landing-60fps.mp4" type="video/mp4" />
                  <source src="/media/optimized/vouchedge-landing-desktop.mp4" type="video/mp4" />
                </video>

                {/* Optical HUD scanlines */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_4px)]"
                />

                {/* Video controls strip */}
                <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-2 pointer-events-auto bg-black/80 backdrop-blur-md px-2 py-1.5 border-t border-neutral-800/80 font-mono text-[9px] sm:bottom-2 sm:left-2 sm:right-2 sm:border sm:border-white/15 sm:px-3">
                  <span className="min-w-0 truncate text-cyan-300 font-bold uppercase tracking-wider sm:tracking-widest">
                    <span className="sm:hidden">OPTICAL [60FPS]</span>
                    <span className="hidden sm:inline">OPTICAL TELEMETRY [60FPS]</span>
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={replayHeroVideo}
                      className="text-zinc-300 hover:text-white bg-transparent border-0 cursor-pointer font-mono text-[9px] uppercase tracking-wider"
                    >
                      ↻ REPLAY
                    </button>
                    <span className="text-zinc-600">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !videoMuted;
                        setVideoMuted(next);
                        if (heroVideoRef.current) {
                          heroVideoRef.current.muted = next;
                          void heroVideoRef.current.play();
                        }
                      }}
                      className="text-zinc-300 hover:text-white bg-transparent border-0 cursor-pointer font-mono text-[9px] uppercase tracking-wider"
                    >
                      {videoMuted ? '◌ SOUND OFF' : '◉ SOUND ON'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Research Dossier Console */}
              <div className="p-3 sm:p-5 bg-black space-y-3 sm:space-y-4">

                {/* Player Dossier Row with Large Typography */}
                <div className="flex items-center justify-between gap-2 border border-neutral-800/80 bg-zinc-950 p-3 sm:gap-5 sm:border-white/20 sm:p-5">
                  <div className="flex items-center gap-2.5 min-w-0 sm:gap-4">
                    <img
                      src={mlbHeadshot(validPlayerId)}
                      alt=""
                      className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 border border-neutral-700 object-cover bg-black rounded-none sm:border-2 sm:border-white/30"
                    />
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-400 block">
                        PLAYER DOSSIER
                      </span>
                      <strong className="text-sm sm:text-2xl font-black text-white block truncate tracking-tight mt-0.5">
                        {player?.playerName || 'PLAYER UNAVAILABLE'}
                      </strong>
                      <span className="font-mono text-[10px] sm:text-sm text-zinc-300 block truncate mt-0.5">
                        {displayTeam(player?.team)} vs {player?.opponent || 'OPPONENT PENDING'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 border-l border-white/15 pl-3 sm:pl-5">
                    <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-zinc-400 block">
                      HR INDEX
                    </span>
                    <strong className="font-mono text-2xl sm:text-5xl font-black text-emerald-300 block leading-none mt-1">
                      {typeof player?.hrScore === 'number' ? Math.round(player.hrScore) : '—'}
                    </strong>
                    <span className="font-mono text-[10px] sm:text-xs font-bold text-cyan-300 block mt-1">
                      CONF {formatConfidence(player?.dataConfidence)}
                    </span>
                  </div>
                </div>

                {/* Tactical Evidence Signal Grid (4 High-Contrast Cells) */}
                <div className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto sm:grid sm:grid-cols-4">
                  {preview.evidenceItems.slice(0, 4).map((item) => (
                    <div
                      key={item.label}
                      className="w-[76%] snap-start shrink-0 border border-neutral-800/80 bg-zinc-950 p-2.5 flex flex-col justify-between min-h-[64px] sm:w-auto sm:border-white/15 sm:min-h-[72px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-400 truncate">
                          {item.label}
                        </span>
                        <span
                          className={`font-mono text-[7px] font-bold px-1 border ${
                            item.state === 'available' ? 'border-emerald-400/40 text-emerald-300 bg-emerald-950/30' :
                            item.state === 'partial' ? 'border-amber-400/40 text-amber-300 bg-amber-950/30' : 'border-zinc-700 text-zinc-400 bg-zinc-900'
                          }`}
                        >
                          {item.state.toUpperCase()}
                        </span>
                      </div>
                      <strong className="font-mono text-[11px] font-bold text-white truncate block mt-1">
                        {item.detail || 'UNAVAILABLE'}
                      </strong>
                      <span className="font-mono text-[7px] text-zinc-500 truncate block">
                        {item.source}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer Timestamp */}
                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2.5 font-mono text-[9px] text-zinc-400">
                  <span className="min-w-0 truncate">SOURCE: {preview.sourceLabel || 'SOURCE PENDING'}</span>
                  <span className="shrink-0">{preview.feedTimestamp ? String(preview.feedTimestamp) : 'FEED TIME UNAVAILABLE'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM 8-STEP INTERACTIVE SCRUBBER */}
        <nav aria-label="Story steps" className="hidden border border-white/15 bg-zinc-950 p-2 font-mono shrink-0 md:block">
          <div className="scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto sm:grid sm:grid-cols-8 sm:gap-1">
            {storySteps.map((story) => {
              const isActive = activeStory === story.id;
              const isPassed = activeStory > story.id;

              return (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => goToStory(story.id)}
                  aria-current={isActive ? 'step' : undefined}
                  className={`snap-start shrink-0 px-3 py-1 text-left border text-xs transition-colors cursor-pointer flex items-center gap-1.5 sm:px-2 sm:py-2 sm:flex-col sm:items-stretch sm:justify-between ${
                    isActive
                      ? 'border-white bg-white text-black font-bold'
                      : isPassed
                      ? 'border-white/20 bg-zinc-900 text-cyan-300 hover:border-white/40'
                      : 'border-white/10 bg-black text-zinc-400 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <span className="text-[9px] font-bold block">0{story.id}</span>
                  <span className="text-[9px] uppercase tracking-wider block font-bold truncate">
                    {storyPhaseLabel(story.id)}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
      </div>
    </div>
  );
}

function MobileChapterMarker({ chapter, label, final = false }: { chapter: string; label: string; final?: boolean }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-4 top-[68px] z-20 flex items-center justify-between gap-2 border-b border-zinc-800 pb-2 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-400 md:hidden">
        <span className="min-w-0 truncate">VOUCHEDGE // {chapter}</span>
        <span className="shrink-0 text-zinc-500">{label}</span>
      </div>
      <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 flex items-center justify-between border-t border-zinc-800 pt-2 font-mono text-[9px] uppercase tracking-wider text-zinc-500 md:hidden">
        <span>{chapter}</span>
        <span>{final ? 'End of record' : 'Scroll // next chapter ↓'}</span>
      </div>
    </>
  );
}


export default function VouchEdgeLandingV3(props: Props) {
  return (
    <main className="vu-landing ve-hud-grid-page ve-landing-sharp ve-mobile-story overflow-x-clip bg-black text-white selection:bg-white selection:text-black">
      <nav className="fixed top-0 left-0 w-full h-14 sm:h-16 z-50 px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-2 bg-black/90 backdrop-blur-xl border-b border-neutral-800/80 sm:border-white/15">
        <a href="#top" className="inline-flex min-w-0 flex-1 items-center gap-2 text-white no-underline text-[11px] font-bold tracking-wider sm:gap-2.5 sm:text-sm">
          <img src="/vouchedge-mark-aurora.svg" alt="VouchEdge Logo" width="24" height="24" aria-hidden="true" />
          <span className="truncate font-mono tracking-widest">VOUCHEDGE</span>
          <b className="hidden px-1.5 py-0.5 border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 font-mono text-[9px] rounded-none font-semibold tracking-widest sm:inline-flex">
            BETA
          </b>
        </a>
        <div className="grid shrink-0 grid-cols-2 items-center gap-1.5 sm:flex sm:gap-3">
          <button
            type="button"
            onClick={props.onLogin}
            className="h-8 border border-zinc-700 bg-black px-2.5 font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-200 transition hover:border-white hover:text-white cursor-pointer rounded-none sm:h-auto sm:border-transparent sm:bg-transparent sm:px-3.5 sm:py-1.5 sm:text-xs sm:font-normal sm:text-zinc-300 sm:hover:border-white/20"
          >
            LOG IN
          </button>
          <button
            type="button"
            onClick={props.onJoinBeta}
            className="h-8 border border-white bg-white px-2.5 font-mono text-[9px] font-bold uppercase tracking-wider text-black transition hover:bg-zinc-100 cursor-pointer rounded-none sm:h-auto sm:px-4 sm:py-1.5 sm:text-xs"
          >
            SIGN UP
          </button>
        </div>
      </nav>

      <div id="how-it-works" className="bg-black md:pt-16">
        <div id="top">
          <div id="record">
            <TruthFlow onJoinBeta={props.onJoinBeta} onViewDemo={props.onViewDemo} />
          </div>
        </div>
      </div>

      <div className="ve-mobile-story-slide ve-mobile-story-slide--integrity relative">
        <MobileChapterMarker chapter="03 / INTEGRITY" label="PUBLIC RECORD" />
        <EvidenceIntegrityJourney />
      </div>
      <div className="ve-mobile-story-slide ve-mobile-story-slide--community vu-chapter vu-chapterCommunity bg-black border-t border-white/15">
        <MobileChapterMarker chapter="05 / COMMUNITY" label="CONSENSUS" />
        <CommunitySection onExploreCommunity={props.onExploreCommunity} />
      </div>
      <div className="ve-mobile-story-slide ve-mobile-story-slide--pricing vu-chapter vu-chapterPricing bg-black border-t border-white/15">
        <MobileChapterMarker chapter="06 / ACCESS" label="OPEN BETA" />
        <PricingSection onJoinBeta={props.onJoinBeta} />
      </div>
      <div className="ve-mobile-story-slide ve-mobile-story-slide--faq vu-chapter vu-chapterFAQ bg-black border-t border-white/15">
        <MobileChapterMarker chapter="07 / FAQ" label="CLEAR ANSWERS" />
        <FAQSection />
      </div>
      <div className="ve-mobile-story-slide ve-mobile-story-slide--cta vu-chapter vu-chapterCTA bg-black border-t border-white/15">
        <MobileChapterMarker chapter="08 / ACCESS" label="MAKE THE CALL" />
        <CTASection onJoinBeta={props.onJoinBeta} onViewDemo={props.onViewDemo} />
      </div>
      <div className="ve-mobile-story-slide ve-mobile-story-slide--footer relative bg-black">
        <MobileChapterMarker chapter="09 / RECORD" label="SYSTEM END" final />
        <FooterSection onNavigate={props.onFooterNavigate} />
      </div>
    </main>
  );
}
