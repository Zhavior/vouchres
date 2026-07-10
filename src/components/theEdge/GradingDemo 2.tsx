import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from '../../lib/motion';
import { Radio } from 'lucide-react';

/**
 * Small looping animation showing a pick move through lock → live → graded.
 * Stands in for a real product demo video (none exists yet) — motion that
 * demonstrates the mechanism instead of a static claim.
 */
const GRADING_DEMO_FRAMES = [
  { label: 'Pick locked', detail: 'Aaron Judge — Over 0.5 HR · +150', tone: 'text-white/60', dot: 'bg-white/40' },
  { label: 'Live · Top 6th', detail: '2–1 · tracking official box score', tone: 'text-vouch-cyan', dot: 'bg-vouch-cyan animate-pulse' },
  { label: 'Graded: Won', detail: 'Published to ledger · no edits made', tone: 'text-vouch-emerald', dot: 'bg-vouch-emerald' },
];

export function GradingDemo() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % GRADING_DEMO_FRAMES.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  const current = GRADING_DEMO_FRAMES[frame];

  return (
    <div className="glass-panel glass-border rounded-2xl p-5">
      <div className="flex items-center gap-2 terminal-text">
        <Radio className="h-3.5 w-3.5" /> Live example
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={frame}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35 }}
          className="mt-3"
        >
          <div className={`flex items-center gap-2 text-sm font-bold ${current.tone}`}>
            <span className={`h-2 w-2 rounded-full ${current.dot}`} />
            {current.label}
          </div>
          <div className="mt-1 font-mono text-xs text-white/30">{current.detail}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
