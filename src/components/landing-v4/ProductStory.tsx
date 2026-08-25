import React, { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';

const STAGES = [
  {
    id: '01',
    label: 'DISCOVER',
    title: 'Find the signal.',
    desc: 'VouchEdge scans the active MLB slate and ranks candidates using measurable power, matchup, park, and evidence signals.',
    image: '/media/features/today-desk.webp',
    // Slate counters and the research-rows headline.
    focus: '50% 10%',
    alt: "Today's command desk showing the slate counters and available research rows",
  },
  {
    id: '02',
    label: 'INVESTIGATE',
    title: 'Inspect the evidence.',
    desc: 'A score without evidence is just another opinion. Open the candidate and inspect exactly what pushed the model higher — and what data is still missing.',
    image: '/media/features/hr-intelligence.webp',
    // The HRPI leader HUD and the evidence vector beneath it.
    focus: '50% 62%',
    alt: 'Home run board showing the evidence vector and the feeds still missing for each candidate',
  },
  {
    id: '03',
    label: 'LOCK',
    title: 'Commit before the outcome.',
    desc: 'When the evidence is strong enough, lock the hypothesis. VouchEdge records the model state, evidence coverage, confidence, and timestamp.',
    image: '/media/features/today-desk.webp',
    /*
     * Same capture as stage 01, framed on the first-pitch lock panel — the
     * countdown, the matchup lock telemetry, both starting arms. There is no
     * standalone capture of a lock, and this is the real artifact rather than
     * a mock of one.
     */
    focus: '92% 46%',
    alt: 'First pitch lock panel counting down, with the matchup lock telemetry for that game',
  },
  {
    id: '04',
    label: 'VERIFY',
    title: 'Let the record speak.',
    desc: 'After the game, the hypothesis remains exactly where it was left — win or lose. Accountability is the only edge.',
    image: '/media/features/results-desk.webp',
    // The graded slate record.
    focus: '50% 40%',
    alt: 'Results ledger showing the graded slate record for a past date',
  }
];

/**
 * One narrative stage.
 *
 * Extracted so `useTransform` is called at a component's top level. It used to
 * run inside `STAGES.map(...)`, which breaks the Rules of Hooks: the hook order
 * is only stable because STAGES is a module constant, and it would corrupt the
 * moment that list became dynamic. Same transforms, same output.
 */
function StageNarrative({
  stage,
  index,
  progress,
}: {
  stage: (typeof STAGES)[number];
  index: number;
  progress: MotionValue<number>;
}) {
  const start = index * 0.25;
  const end = (index + 1) * 0.25;
  const keyframes = [start, start + 0.05, end - 0.05, end];

  const opacity = useTransform(progress, keyframes, [0, 1, 1, 0]);
  const y = useTransform(progress, keyframes, [20, 0, 0, -20]);

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 flex flex-col justify-center">
      <span className="text-[10px] font-mono text-ve-emerald uppercase tracking-[0.4em] mb-6 block">{stage.id} / {stage.label}</span>
      <h2 className="text-5xl md:text-6xl font-bold italic tracking-tighter text-white mb-8 leading-tight">{stage.title}</h2>
      <p className="text-xl text-white/55 leading-relaxed max-w-md font-light">{stage.desc}</p>
    </motion.div>
  );
}

/**
 * One stage's screenshot.
 *
 * Split out for the same reason as StageNarrative — `useTransform` has to run
 * at a component's top level, not inside `STAGES.map(...)`.
 *
 * The image is cropped by `object-position` rather than by cutting new assets,
 * so stage 03 can frame the lock panel inside the same capture stage 01 uses
 * without shipping a second file.
 */
function StageVisual({
  stage,
  index,
  progress,
}: {
  stage: (typeof STAGES)[number];
  index: number;
  progress: MotionValue<number>;
}) {
  const start = index * 0.25;
  const end = (index + 1) * 0.25;
  const opacity = useTransform(
    progress,
    [start, start + 0.04, end - 0.04, end],
    [0, 1, 1, 0],
  );

  return (
    <motion.img
      style={{ opacity, objectPosition: stage.focus }}
      src={stage.image}
      alt={stage.alt}
      loading={index === 0 ? 'eager' : 'lazy'}
      decoding="async"
      className="absolute inset-0 h-full w-full scale-[1.02] object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.12] motion-reduce:transition-none motion-reduce:group-hover:scale-[1.02]"
    />
  );
}

export default function ProductStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <div ref={containerRef} className="relative h-[400vh] bg-obsidian-950">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="container mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Left: Narrative Navigation */}
          <div className="relative h-[400px]">
            {STAGES.map((stage, i) => (
              <StageNarrative key={stage.id} stage={stage} index={i} progress={scrollYProgress} />
            ))}
          </div>

          {/* Right: Product Visualization */}
          {/*
            Was a static placeholder — a `System_Visualization_v4.0` chrome bar
            and a pulsing `[ Processing_Neural_Feed ]`. Both invented, and it
            never changed across the four stages, so the scroll narrative had no
            visual payoff at all. Each stage now shows the real desk it
            describes, framed on the part of the capture the copy is about.

            `group` + `peer`-free hover: the whole frame is the hover target, so
            moving between stages mid-hover does not strand a zoomed image.
          */}
          <div className="group relative aspect-video overflow-hidden border border-white/5 bg-obsidian-900/50 shadow-2xl">
            {STAGES.map((stage, i) => (
              <StageVisual key={stage.id} stage={stage} index={i} progress={scrollYProgress} />
            ))}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/5 bg-[#050505]/80 px-4 py-2 backdrop-blur-sm">
              <span className="terminal-text">{'{ '}VouchEdge · live product{' }'}</span>
              <span className="terminal-text opacity-40">Hover to enlarge</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
