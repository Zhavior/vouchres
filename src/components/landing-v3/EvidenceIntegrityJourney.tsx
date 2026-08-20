import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import './evidence-integrity-journey.css';

const EvidenceEarthGlobe = lazy(() => import('./EvidenceEarthGlobe'));

type IntegrityPhase = 1 | 2 | 3 | 4;

const integrityPhases = [
  {
    id: 1 as IntegrityPhase,
    label: 'RESEARCHED',
    eyebrow: 'RESEARCH LIMITS / PUBLIC RECORD',
    title: 'Evidence should explain itself.',
    body: 'Confidence describes the strength of the available evidence, not a promise of an outcome. VouchRes keeps every source and missing-data note visible instead of curating a highlight reel of successful examples.',
    receipt: 'MATCHUP METRICS · SOURCE NOTES · MISSING-DATA STATES',
  },
  {
    id: 2 as IntegrityPhase,
    label: 'TIME STAMPED',
    eyebrow: 'METHODOLOGY / INTEGRITY PRINCIPLE',
    title: 'The reasoning is saved before the result exists.',
    body: 'A tracked decision retains the evidence state, confidence context, and missing-data notes that were available pre-game. The landing preview does not invent a saved record.',
    receipt: 'ORIGINAL EVIDENCE STATE · PRE-GAME TIME · LIMITS RETAINED',
  },
  {
    id: 3 as IntegrityPhase,
    label: 'COMPARED TO RESULT',
    eyebrow: 'WHAT IT MEANS',
    title: 'The final result meets the original decision.',
    body: 'Available matchup metrics, historical baselines, and context form a repeatable workflow. When an outcome is known, it is attached to the original record—not used to rewrite it.',
    receipt: 'ORIGINAL RESEARCH → OFFICIAL RESULT · NO RETROACTIVE EDIT',
  },
  {
    id: 4 as IntegrityPhase,
    label: 'RETAINED',
    eyebrow: 'WHAT IT DOES NOT MEAN',
    title: 'Decision intelligence, not a prediction oracle.',
    body: 'VouchEdge never claims guaranteed hits, guaranteed home runs, or lock-of-the-night certainty. Baseball is stochastic; wins, losses, and inconclusive evidence belong in the same record.',
    receipt: 'WINS + LOSSES VISIBLE · NO HIGHLIGHT-REEL CURATION',
  },
] as const;

export default function EvidenceIntegrityJourney() {
  const trackRef = useRef<HTMLElement>(null);
  const activeRef = useRef<IntegrityPhase>(1);
  const [active, setActive] = useState<IntegrityPhase>(1);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });

  const hasAutoReturnedRef = useRef(true); // Initialized to true so initial arrival at top of Public Records never triggers a bounce back
  const prevProgressRef = useRef(0);

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (typeof window === 'undefined' || window.matchMedia('(max-width: 767px)').matches) return;
    const next = Math.min(4, Math.floor(Math.min(0.999, Math.max(0, progress)) * 4) + 1) as IntegrityPhase;
    if (next !== activeRef.current) {
      activeRef.current = next;
      setActive(next);
    }

    const isScrollingUp = progress < prevProgressRef.current;

    // Supported user experience: only when customer was inside Public Records and intentionally scrolls UP past Phase 01,
    // smoothly guide them back up into the HUD story (Phase 08)
    if (isScrollingUp && progress <= 0.05 && !hasAutoReturnedRef.current) {
      hasAutoReturnedRef.current = true;
      const hudTarget = document.getElementById('how-it-works') || document.getElementById('record');
      if (hudTarget) {
        const hudRect = hudTarget.getBoundingClientRect();
        const targetScroll = window.scrollY + hudRect.bottom - window.innerHeight;
        window.scrollTo({ top: Math.max(0, targetScroll), behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    } else if (progress > 0.15) {
      hasAutoReturnedRef.current = false;
    }

    prevProgressRef.current = progress;
  });

  const goToPhase = useCallback((phase: IntegrityPhase) => {
    const track = trackRef.current;
    if (!track) return;
    activeRef.current = phase;
    setActive(phase);
    const start = track.getBoundingClientRect().top + window.scrollY;
    const usable = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: start + usable * ((phase - 1) / 3), behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [reduceMotion]);

  const phase = integrityPhases[active - 1];

  return (
    <section ref={trackRef} id="transparency-over-hype" className="ve-integrityJourney bg-black" aria-label="How VouchEdge preserves evidence">
      <div className="ve-integrityJourney__pin">
        <header className="ve-integrityJourney__hud">
          <span>VOUCHEDGE // PUBLIC RECORD</span>
          <span>INTEGRITY PHASE 0{active} / 04</span>
        </header>

        <div className="ve-integrityJourney__frame">
          <aside className="ve-integrityJourney__story">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
                className="will-change-[transform,opacity] [transform:translateZ(0)]"
              >
                <span className="ve-integrityJourney__eyebrow">{phase.eyebrow}</span>
                <strong className="ve-integrityJourney__phase">{phase.label}</strong>
                <h2>{phase.title}</h2>
                <p>{phase.body}</p>
              </motion.div>
            </AnimatePresence>

            <ol className="ve-integrityJourney__rail">
              {integrityPhases.map((item) => (
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

          <div className="ve-integrityJourney__world">
            <div className="ve-integrityJourney__worldHead">
              <span>ONE RECORD / FOUR STATES</span>
              <span>NO GUARANTEE CLAIMED</span>
            </div>

            <div className="ve-integrityJourney__earthStage bg-black">
              <Suspense fallback={<div className="ve-integrityJourney__canvasFallback">INITIALIZING EVIDENCE WORLD</div>}>
                <EvidenceEarthGlobe active={active} onSelect={goToPhase} reduceMotion={Boolean(reduceMotion)} />
              </Suspense>

              <div className={active === 2 ? 've-integrityJourney__earthLabel is-time-stamped' : 've-integrityJourney__earthLabel'}>
                <span>PHASE 0{active}</span>
                <strong>{phase.label}</strong>
                <small>EVIDENCE STATE PRESERVED</small>
              </div>
            </div>

            <footer className="ve-integrityJourney__receipt">
              <span>{phase.eyebrow}</span>
              <strong>{phase.receipt}</strong>
            </footer>
          </div>
        </div>
      </div>
    </section>
  );
}
