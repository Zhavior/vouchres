import { Home, Plus, Sparkles as EdgeIslandIcon } from 'lucide-react';
import { preloadSection } from '../lib/routePreload';

type AppNavProps = {
  activeSection: string;
  onNavigate: (section: string) => void;
  onOpenEdgeIsland: () => void;
};

export function AppNav({ activeSection, onNavigate, onOpenEdgeIsland }: AppNavProps) {
  return (
    <div className="ve-mobile-fab-cluster fixed z-[60] flex items-center gap-2.5 md:bottom-8 md:right-8 md:gap-0">
      <button
        type="button"
        onClick={() => onNavigate('feed')}
        onMouseEnter={() => preloadSection('feed')}
        onFocus={() => preloadSection('feed')}
        aria-label="Go to Home Feed"
        title="Home Feed"
        className={`ve-edge-island-trigger z8-interactive flex h-11 w-11 items-center justify-center rounded-full md:hidden ${
          activeSection === 'feed' ? 'border-vouch-emerald/70' : ''
        }`}
      >
        <Home className="ve-edge-island-trigger-icon h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onNavigate('board')}
        onMouseEnter={() => preloadSection('board')}
        onFocus={() => preloadSection('board')}
        aria-label="Go to Vouch Board"
        title="Vouch Board"
        className={`ve-edge-island-trigger z8-interactive flex h-11 w-11 items-center justify-center rounded-full md:hidden ${
          activeSection === 'board' ? 'border-vouch-emerald/70' : ''
        }`}
      >
        <Plus className="ve-edge-island-trigger-icon h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onOpenEdgeIsland}
        aria-label="Open The Edge Island"
        title="The Edge Island"
        className="ve-edge-island-trigger z8-interactive flex h-11 w-11 items-center justify-center rounded-full md:h-12 md:w-12"
      >
        <EdgeIslandIcon className="ve-edge-island-trigger-icon h-4 w-4 md:h-5 md:w-5" />
      </button>
    </div>
  );
}
