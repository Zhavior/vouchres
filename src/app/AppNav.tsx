import { Menu, Flame, Brain } from 'lucide-react';
import { preloadSection } from '../lib/routePreload';
import { useNavUiStore } from '../stores/navUiStore';

type AppNavProps = {
  activeSection: string;
  onNavigate: (section: string) => void;
};

export function AppNav({ activeSection, onNavigate }: AppNavProps) {
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
        onClick={() => onNavigate('brain_picks')}
        onPointerDown={() => preloadSection('brain_picks')}
        onMouseEnter={() => preloadSection('brain_picks')}
        onFocus={() => preloadSection('brain_picks')}
        aria-label="Go to Brain Picks"
        title="Brain Picks"
        className="ve-edge-island-trigger ve-touch-target z8-interactive flex h-11 w-11 items-center justify-center rounded-full md:hidden"
      >
        <Brain className="ve-edge-island-trigger-icon h-4 w-4" />
      </button>
    </div>
  );
}
