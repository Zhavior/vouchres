import '../styles/vouchres-ultimate-truth-landing.css';
import '../styles/public-landing.css';
import '../components/landing-v4/evidence-field.css';
import '../components/landing-v4/premium-hero.css';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  DecisionIntelligence,
  CommunitySection,
  PricingSection,
  FAQSection,
  CTASection,
  FooterSection,
  ResearchPreviewSection,
  type FooterNavigationTarget,
} from '../components/landing-v3';

import {
  useResearchPreview,
  type ResearchPreview,
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
    : 'https://img.mlbstatic.com/mlb-photos/image/upload/w_160,q_auto:best/v1/people/592450/headshot/67/current';
}


function displayTeam(team?: string) {
  if (!team) return 'TEAM PENDING';
  if (team === 'LAA') return 'ANGELS';
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

function EvidenceField({
  preview,
  story,
}: {
  preview: ReturnType<typeof useResearchPreview>;
  story: StoryStep;
}) {
  const evidence = preview.evidenceItems.slice(0, 6);

  const positions = [
    [18, 27],
    [80, 24],
    [84, 59],
    [67, 79],
    [21, 70],
    [38, 17],
  ] as const;

  return (
    <div
      className="vu-evidenceMachine"
      data-story={story}
      data-truth={
        preview.isError
          ? 'error'
          : preview.usingDemo
            ? 'sample'
            : preview.isLoading
              ? 'loading'
              : 'live'
      }
      aria-hidden="true"
    >
      <div className="vu-evidenceMachineGrid" />
      <div className="vu-evidenceMachineScan" />

      <div className="vu-machineTelemetry vu-machineTelemetryTop">
        <span>VOUCHEDGE / EVIDENCE MACHINE</span>
        <b>{storyPhaseLabel(story)}</b>
      </div>

      <svg
        className="vu-evidenceNetwork"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {evidence.map((item, index) => {
          const [x, y] = positions[index];

          return (
            <motion.line
              key={`${item.label}-${index}`}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              vectorEffect="non-scaling-stroke"
              className={`vu-evidenceTrace vu-evidenceTrace-${item.state}`}
              initial={false}
              animate={{
                opacity: story === 1 ? 0.12 : story >= 6 ? 0.28 : 0.72,
                pathLength: story === 1 ? 0.08 : 1,
              }}
              transition={{
                duration: 0.36,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          );
        })}
      </svg>

      {evidence.map((item, index) => {
        const [x, y] = positions[index];

        return (
          <motion.div
            key={`${item.label}-${item.state}-${index}`}
            className={`vu-evidencePoint vu-evidencePoint-${item.state}`}
            initial={false}
            animate={{
              left:
                story === 3
                  ? `${index < 3 ? 18 : 82}%`
                  : story >= 6
                    ? `${index < 3 ? 30 : 70}%`
                    : `${x}%`,
              top:
                story === 3
                  ? `${29 + (index % 3) * 21}%`
                  : story >= 6
                    ? `${30 + (index % 3) * 20}%`
                    : `${y}%`,
              opacity: story === 1 ? 0.34 : 1,
              scale: story === 1 ? 0.76 : story >= 6 ? 0.88 : 1,
            }}
            transition={{
              duration: 0.36,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <i />

            <div>
              <span>{item.label}</span>
              <b>{item.state.toUpperCase()}</b>

              {story >= 2 && story <= 4 && item.detail ? (
                <small>{item.detail}</small>
              ) : null}
            </div>
          </motion.div>
        );
      })}

      <motion.div
        className="vu-machineCore"
        initial={false}
        animate={{
          scale: story === 4 ? 1.12 : story >= 6 ? 0.94 : 1,
        }}
        transition={{
          duration: 0.36,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <span>
          {story === 4
            ? 'WHY'
            : story === 6
              ? 'RECORD'
              : story === 7
                ? 'ORIGINAL'
                : story === 8
                  ? 'HISTORY'
                  : 'MATCHUP'}
        </span>

        <strong>
          {story === 4
            ? formatConfidence(preview.primaryPlayer?.dataConfidence)
            : preview.primaryPlayer?.playerName || 'RESOLVING'}
        </strong>

        <small>
          {story === 4
            ? 'CONFIDENCE'
            : preview.primaryPlayer?.opponent
              ? `VS ${preview.primaryPlayer.opponent}`
              : 'MATCHUP PENDING'}
        </small>
      </motion.div>

      <motion.div
        className="vu-machineLock"
        initial={false}
        animate={{
          opacity: story === 6 ? 1 : 0,
          scale: story === 6 ? 1 : 1.03,
        }}
      >
        <span>PRE-GAME RECORD</span>
        <b>RESEARCH STATE RETAINED</b>
        <small>SOURCES · EVIDENCE · CONFIDENCE · THESIS</small>
      </motion.div>

      <motion.div
        className="vu-machineOutcome"
        initial={false}
        animate={{
          opacity: story === 7 ? 1 : 0,
          x: story === 7 ? 0 : 30,
        }}
      >
        <span>OUTCOME</span>
        <b>REALITY ENTERS HERE</b>
        <small>THE ORIGINAL RECORD DOES NOT MOVE</small>
      </motion.div>

      <motion.div
        className="vu-machineHistory"
        initial={false}
        animate={{ opacity: story === 8 ? 1 : 0 }}
      >
        <span>DECISION HISTORY</span>

        <div>
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>

        <small>THE NEXT DECISION STARTS WITH WHAT THE LAST ONE TAUGHT.</small>
      </motion.div>

      <div className="vu-machineTelemetry vu-machineTelemetryBottom">
        <span>{preview.sourceLabel || 'SOURCE PENDING'}</span>
        <b>{preview.statusLabel || 'RESEARCH STATE'}</b>
      </div>
    </div>
  );
}

function ResearchInstrument({
  preview,
  story,
}: {
  preview: ReturnType<typeof useResearchPreview>;
  story: StoryStep;
}) {
  const player = preview.primaryPlayer;

  const playerId = Number(player?.playerId);
  const validPlayerId = Number.isFinite(playerId) ? playerId : undefined;

  return (
    <section className="vu-researchInstrument" data-story={story}>
      <header className="vu-instrumentHeader">
        <div>
          <span>VOUCHEDGE // LIVE RESEARCH</span>
          <b>{storyPhaseLabel(story)}</b>
        </div>

        <div>
          <span>{preview.statusLabel}</span>
          <i
            className={
              preview.isError
                ? 'error'
                : preview.usingDemo
                  ? 'partial'
                  : 'live'
            }
          />
        </div>
      </header>

      <div className="vu-instrumentIdentity">
        <div className="vu-instrumentPlayer">
          <img
            src={mlbHeadshot(validPlayerId)}
            alt=""
            aria-hidden="true"
          />

          <div>
            <span>PLAYER</span>
            <strong>{player?.playerName || 'LIVE PLAYER PENDING'}</strong>
            <small>
              {displayTeam(player?.team)}
              {player?.opponent ? ` / VS ${player.opponent}` : ''}
            </small>
          </div>
        </div>

        <div className="vu-instrumentScore">
          <span>HR INDEX</span>
          <strong>
            {typeof player?.hrScore === 'number'
              ? Math.round(player.hrScore)
              : '—'}
          </strong>
          <small>
            CONFIDENCE {formatConfidence(player?.dataConfidence)}
          </small>
        </div>
      </div>

      <div className="vu-instrumentEvidence">
        {preview.evidenceItems.slice(0, 4).map((item) => (
          <article key={`${item.label}-${item.source}`}>
            <div>
              <span>{item.label}</span>
              <b className={item.state}>{item.state.toUpperCase()}</b>
            </div>

            <strong>{item.detail || 'NO VALUE AVAILABLE'}</strong>
            <p>{item.explanation}</p>

            <footer>
              <span>{item.source}</span>
              <span>{item.freshness}</span>
            </footer>
          </article>
        ))}
      </div>

      <footer className="vu-instrumentFooter">
        <span>
          {preview.sourceLabel || 'VOUCHEDGE RESEARCH'}
        </span>

        <b>
          {preview.feedTimestamp
            ? String(preview.feedTimestamp)
            : 'FEED TIMESTAMP PENDING'}
        </b>
      </footer>
    </section>
  );
}

function TruthFlow({
  onJoinBeta,
  onViewDemo,
}: Pick<Props, 'onJoinBeta' | 'onViewDemo'>) {
  const canvas = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  const preview = useResearchPreview();

  const [activeStory, setActiveStory] = useState<StoryStep>(1);
  const [videoMuted, setVideoMuted] = useState(true);
  const [introDocked, setIntroDocked] = useState(false);

  useEffect(() => {
    if (introDocked) return;

    const timer = window.setTimeout(() => {
      setIntroDocked(true);
    }, 4000);

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

  const scrollYProgress = useSpring(rawScrollYProgress, {
    stiffness: 86,
    damping: 26,
    restDelta: 0.001,
  });

  const boardY = useTransform(
    scrollYProgress,
    [0, 0.12, 0.94, 1],
    [22, 0, 0, -18],
  );

  const boardScale = useTransform(
    scrollYProgress,
    [0, 0.12, 0.68, 0.94],
    [0.985, 1, 0.99, 0.96],
  );

  const copyY = useTransform(
    scrollYProgress,
    [0, 0.12, 0.94],
    [18, 0, -10],
  );

  const progressScale = useTransform(
    scrollYProgress,
    [0.1, 0.94],
    [0, 1],
  );

  const activeStoryRef = useRef<StoryStep>(1);

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (!introDocked && progress > 0.02) {
      setIntroDocked(true);
    }

    const normalized = Math.min(
      1,
      Math.max(0, (progress - 0.12) / 0.82),
    );

    const nextStory = Math.min(
      8,
      Math.max(1, Math.floor(normalized * 8) + 1),
    ) as StoryStep;

    if (nextStory !== activeStoryRef.current) {
      activeStoryRef.current = nextStory;
      setActiveStory(nextStory);
    }
  });

  const goToStory = (story: StoryStep) => {
    const el = canvas.current;
    if (!el) return;

    const start =
      el.getBoundingClientRect().top + window.scrollY;

    const usableScroll = el.offsetHeight - window.innerHeight;

    const progress =
      0.12 + ((story - 1) / 7) * 0.82;

    window.scrollTo({
      top: start + usableScroll * progress,
      behavior: 'smooth',
    });
  };

  const currentStory = storySteps[activeStory - 1];

  return (
    <div
      id="truth-flow"
      ref={canvas}
      className="vu-story vu-storyV4"
    >
      <div className="vu-pinned vu-pinnedV4">
        <EvidenceField
          preview={preview}
          story={activeStory}
        />

        <div className="vu-storyComposition">
          <motion.div
            className="vu-storyCopyV4"
            style={{ y: copyY }}
          >
            <span className="vu-eyebrow">
              VOUCHEDGE / {currentStory.tag}
            </span>

            <motion.div
              key={activeStory}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.34,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <h1>
                {activeStory === 1
                  ? 'See the matchup before the noise.'
                  : currentStory.title}
              </h1>

              <p>{currentStory.body}</p>
            </motion.div>

            {activeStory === 1 ? (
              <>
                <div className="vu-ctas">
                  <button
                    className="vu-primary"
                    onClick={onJoinBeta}
                  >
                    GET BETA ACCESS
                  </button>

                  <button
                    onClick={() => {
                      onViewDemo();

                      document
                        .getElementById('research-preview')
                        ?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                    }}
                  >
                    EXPLORE LIVE RESEARCH <span>↓</span>
                  </button>
                </div>

                <div className="vu-meta">
                  <span>REAL RESEARCH INPUTS</span>
                  <span>VISIBLE MISSING DATA</span>
                  <span>PRE-GAME RECORD</span>
                </div>
              </>
            ) : (
              <div className="vu-storyStatusV4">
                <span>{currentStory.status}</span>
                <b>{storyPhaseLabel(activeStory)}</b>
              </div>
            )}
          </motion.div>

          <motion.div
            className="vu-storyInstrumentMotion"
            style={{
              y: boardY,
              scale: boardScale,
            }}
          >
            <div
              className={`vu-heroVisual ${
                introDocked
                  ? 'vu-docked'
                  : 'vu-fullscreenIntro'
              }`}
            >
              {!introDocked ? (
                <button
                  className="vu-skipIntro"
                  type="button"
                  onClick={() => setIntroDocked(true)}
                >
                  SKIP INTRO ✕
                </button>
              ) : null}

              <div className="vu-videoFrame">
                <video
                  ref={heroVideoRef}
                  className="vu-heroVideo"
                  autoPlay
                  muted={videoMuted}
                  loop
                  playsInline
                  preload="metadata"
                  poster="/media/optimized/vouchedge-landing-poster.jpg"
                  aria-label="VouchEdge product preview"
                >
                  <source
                    src="/media/optimized/vouchedge-landing-mobile.mp4"
                    type="video/mp4"
                    media="(max-width: 640px)"
                  />

                  <source
                    src="/media/optimized/vouchedge-landing-desktop.mp4"
                    type="video/mp4"
                  />
                </video>

                <div
                  className="vu-videoScan"
                  aria-hidden="true"
                />

                <div className="vu-videoLabel">
                  <div>
                    <button
                      className="vu-videoReplay"
                      type="button"
                      aria-label="Replay VouchEdge product intro"
                      onClick={replayHeroVideo}
                    >
                      ↻ REPLAY
                    </button>

                    <button
                      className="vu-videoAudio"
                      type="button"
                      aria-pressed={!videoMuted}
                      aria-label={
                        videoMuted
                          ? 'Unmute VouchEdge product video'
                          : 'Mute VouchEdge product video'
                      }
                      onClick={() => {
                        const next = !videoMuted;

                        setVideoMuted(next);

                        if (heroVideoRef.current) {
                          heroVideoRef.current.muted = next;
                          void heroVideoRef.current.play();
                        }
                      }}
                    >
                      {videoMuted
                        ? '◌ SOUND OFF'
                        : '◉ SOUND ON'}
                    </button>

                    <b>VOUCHEDGE / PRODUCT FILM</b>
                  </div>
                </div>
              </div>
            </div>

            <ResearchInstrument
              preview={preview}
              story={activeStory}
            />
          </motion.div>
        </div>

        <div className="vu-storyProgressV4">
          <motion.i
            style={{ scaleX: progressScale }}
          />

          <div>
            {storySteps.map((story) => (
              <button
                key={story.id}
                type="button"
                className={
                  activeStory === story.id
                    ? 'active'
                    : activeStory > story.id
                      ? 'passed'
                      : ''
                }
                onClick={() => goToStory(story.id)}
                aria-label={`Go to ${story.tag}`}
              >
                <span>0{story.id}</span>
                <b>{storyPhaseLabel(story.id)}</b>
              </button>
            ))}
          </div>
        </div>

        <div className="vu-scrubberV4">
          <span>
            0{activeStory} / 08
          </span>

          <b>{storyPhaseLabel(activeStory)}</b>

          <small>
            {preview.sourceLabel || 'VOUCHEDGE'}
          </small>
        </div>
      </div>
    </div>
  );
}

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
      className="vu-realSection vu-decisionStory relative bg-[#050507] bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
    >
      <div id="research-preview">
        <ResearchPreviewSection onExploreBoard={undefined} />
      </div>

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
                  <span className="text-zinc-100">
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
        <span className="sr-only">VOUCHEDGE // ENGINE: VOUCHRES</span>
           <span className="sr-only">VouchRes engine</span>
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
