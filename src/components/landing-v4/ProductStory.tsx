import React, { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';

const STAGES = [
  {
    id: '01',
    label: 'DISCOVER',
    title: 'Find the signal.',
    desc: 'VouchEdge scans the active MLB slate and ranks candidates using measurable power, matchup, park, and evidence signals.'
  },
  {
    id: '02',
    label: 'INVESTIGATE',
    title: 'Inspect the evidence.',
    desc: 'A score without evidence is just another opinion. Open the candidate and inspect exactly what pushed the model higher — and what data is still missing.'
  },
  {
    id: '03',
    label: 'LOCK',
    title: 'Commit before the outcome.',
    desc: 'When the evidence is strong enough, lock the hypothesis. VouchEdge records the model state, evidence coverage, confidence, and timestamp.'
  },
  {
    id: '04',
    label: 'VERIFY',
    title: 'Let the record speak.',
    desc: 'After the game, the hypothesis remains exactly where it was left — win or lose. Accountability is the only edge.'
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
          <div className="relative aspect-video bg-obsidian-900/50 backdrop-blur-xl border border-white/5 flex items-center justify-center overflow-hidden shadow-2xl">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(49,181,131,0.02),transparent_70%)]" />
             
             {/* Dynamic Screen Content based on scroll */}
             <motion.div 
               className="w-full h-full p-8 flex flex-col"
               style={{
                 opacity: useTransform(scrollYProgress, [0, 0.1], [0, 1])
               }}
             >
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                  <span className="terminal-text">System_Visualization_v4.0</span>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-ve-emerald/20" />
                    <div className="w-2 h-2 rounded-full bg-ve-emerald/20" />
                  </div>
                </div>
                
                <div className="flex-1 flex items-center justify-center">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.02, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="text-[10px] font-mono text-ve-emerald uppercase tracking-[0.5em]"
                  >
                    [ Processing_Neural_Feed ]
                  </motion.div>
                </div>
             </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
