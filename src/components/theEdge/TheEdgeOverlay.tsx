import { AnimatePresence, motion } from 'framer-motion';
import { Home, Sparkles } from 'lucide-react';

type TheEdgeOverlayProps = {
  activeSection: string;
  onSectionChange: (section: string) => void;
};

export default function TheEdgeOverlay({
  activeSection,
  onSectionChange,
}: TheEdgeOverlayProps) {
  const isOnTheEdge = activeSection === 'welcome';

  function handleClick() {
    if (isOnTheEdge) {
      onSectionChange('feed');
      return;
    }

    onSectionChange('welcome');
  }

  return (
    <AnimatePresence mode="wait">
      <motion.button
        key={isOnTheEdge ? 'home-button' : 'edge-button'}
        type="button"
        onClick={handleClick}
        initial={{ opacity: 0, y: 18, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.92 }}
        whileHover={{ y: -3, scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="edge-portal-shine ve-theme-gradient ve-theme-glow fixed bottom-5 right-5 z-[70] overflow-hidden rounded-full px-5 py-4 text-sm font-black shadow-2xl"
      >
        <span className="relative flex items-center gap-2">
          <span className="absolute -left-2 h-8 w-8 rounded-full bg-white/25 blur-xl" />
          {isOnTheEdge ? (
            <Home className="relative h-4 w-4" />
          ) : (
            <Sparkles className="relative h-4 w-4" />
          )}
          <span className="relative">{isOnTheEdge ? 'Home' : 'The Edge'}</span>
        </span>
      </motion.button>
    </AnimatePresence>
  );
}
