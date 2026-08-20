import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';
import './evidence-integrity-journey.css';

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

const orbitNodes = [
  [400, 70],
  [630, 300],
  [400, 530],
  [170, 300],
] as const;

export default function EvidenceIntegrityJourney() {
  const trackRef = useRef<HTMLElement>(null);
  const activeRef = useRef<IntegrityPhase>(1);
  const [active, setActive] = useState<IntegrityPhase>(1);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (typeof window === 'undefined' || window.matchMedia('(max-width: 767px)').matches) return;
    const next = Math.min(4, Math.floor(Math.min(0.999, Math.max(0, progress)) * 4) + 1) as IntegrityPhase;
    if (next !== activeRef.current) {
      activeRef.current = next;
      setActive(next);
    }
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
    <section ref={trackRef} id="transparency-over-hype" className="ve-integrityJourney" aria-label="How VouchEdge preserves evidence">
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

            <div className="ve-integrityJourney__earthStage">
              <svg viewBox="0 0 800 600" role="img" aria-label={`Rotating monochrome Earth for the ${phase.label.toLowerCase()} evidence phase`}>
                <defs>
                  <radialGradient id="ve-integrity-earth" cx="34%" cy="27%" r="78%">
                    <stop offset="0%" stopColor="#777" />
                    <stop offset="45%" stopColor="#292929" />
                    <stop offset="100%" stopColor="#050505" />
                  </radialGradient>
                  <clipPath id="ve-integrity-earth-clip"><circle cx="400" cy="300" r="210" /></clipPath>
                </defs>

                <ellipse className="ve-integrityJourney__orbit" cx="400" cy="300" rx="305" ry="108" />
                <ellipse className="ve-integrityJourney__orbit ve-integrityJourney__orbit--tilted" cx="400" cy="300" rx="285" ry="88" transform="rotate(-34 400 300)" />

                <g className="ve-integrityJourney__earth" clipPath="url(#ve-integrity-earth-clip)">
                  <circle className="ve-integrityJourney__sphere" cx="400" cy="300" r="210" />
                  <g className="ve-integrityJourney__grid">
                    <ellipse cx="400" cy="300" rx="210" ry="70" />
                    <ellipse cx="400" cy="300" rx="210" ry="138" />
                    <ellipse cx="400" cy="300" rx="74" ry="210" />
                    <ellipse cx="400" cy="300" rx="142" ry="210" />
                    <path d="M190 300H610" />
                  </g>
                  <g className="ve-integrityJourney__land">
                    <path d="M242 190l38-31 54 7 25 25-17 24-40 5-17 31-27-13-31 8-21-28z" />
                    <path d="M327 252l33 10 18 31-12 38 20 25-17 67-23 31-18-36 8-45-21-38 5-50z" />
                    <path d="M419 177l44-19 64 15 22 27-19 23-50-5-19 18-37-13-28-24z" />
                    <path d="M456 247l49-12 49 21 22 43-17 59-44 39-44-19-19-47-29-32z" />
                    <path d="M557 395l37-12 30 23-8 31-45 8-20-25z" />
                  </g>
                  <path className="ve-integrityJourney__shadow" d="M468 72C346 164 335 424 482 531C592 449 629 172 468 72Z" />
                </g>

                {orbitNodes.map(([x, y], index) => (
                  <g key={index} className={active === index + 1 ? 've-integrityJourney__node is-active' : 've-integrityJourney__node'}>
                    <circle cx={x} cy={y} r={active === index + 1 ? 9 : 5} />
                    <text x={x} y={y - 17} textAnchor="middle">0{index + 1}</text>
                  </g>
                ))}
              </svg>

              <div className="ve-integrityJourney__earthLabel">
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
