import { Menu, Sparkles as EdgeIslandIcon, Flame, Brain } from 'lucide-react';
import { preloadSection } from '../lib/routePreload';
import { useNavUiStore } from '../stores/navUiStore';
import '../styles/legacy/command-island.css';

type AppNavProps = {
  activeSection: string;
  onNavigate: (section: string) => void;
  onOpenEdgeIsland: () => void;
};

export function AppNav({ activeSection, onNavigate, onOpenEdgeIsland }: AppNavProps) {
  const openMobileDrawer = useNavUiStore((s) => s.openMobileDrawer);

  return (
    <div className="ve-mobile-fab-cluster fixed z-[60] flex items-center gap-2.5 md:bottom-8 md:right-8 md:gap-0">
      <button
        type="button"
        onClick={openMobileDrawer}
        aria-label="Open navigation menu"
        title="Menu"
        className="ve-edge-island-trigger ve-touch-target z8-interactive flex h-11 w-11 items-center justify-center rounded-full md:hidden"
      >
        <Menu className="ve-edge-island-trigger-icon h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onNavigate('pro_command_center')}
        onPointerDown={() => preloadSection('pro_command_center')}
        onMouseEnter={() => preloadSection('pro_command_center')}
        onFocus={() => preloadSection('pro_command_center')}
        aria-label="Go to Pro Edges"
        title="Pro Edges"
        className="ve-edge-island-trigger ve-touch-target z8-interactive flex h-11 w-11 items-center justify-center rounded-full md:hidden"
      >
        <Flame className="ve-edge-island-trigger-icon h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => onNavigate('ai_engine')}
        onPointerDown={() => preloadSection('ai_engine')}
        onMouseEnter={() => preloadSection('ai_engine')}
        onFocus={() => preloadSection('ai_engine')}
        aria-label="Go to AI"
        title="AI"
        className="ve-edge-island-trigger ve-touch-target z8-interactive flex h-11 w-11 items-center justify-center rounded-full md:hidden"
      >
        <Brain className="ve-edge-island-trigger-icon h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onOpenEdgeIsland}
        aria-label="Open The Edge Island"
        title="The Edge Island"
        className="ve-edge-island-trigger ve-touch-target z8-interactive flex h-11 w-11 items-center justify-center rounded-full md:h-12 md:w-12"
      >
        <EdgeIslandIcon className="ve-edge-island-trigger-icon h-4 w-4 md:h-5 md:w-5" />
      </button>
    </div>
  );
}
