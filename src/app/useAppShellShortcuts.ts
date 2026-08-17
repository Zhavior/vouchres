import { useEffect } from 'react';
import type { FeatureConfig } from '../lib/featureConfig';
import { FOCUSED_BETA_SHELL_ENABLED } from './betaNavigation';
import { isEditingText, isNavItemActive } from './appNavModel';

/**
 * The app shell's global keyboard map, lifted out of FeedSidebar when the left
 * rail was retired. The rail owned these bindings only because it happened to
 * be the component that was always mounted; they are shell-level behaviour, so
 * they now live in a hook the top bar owns instead.
 *
 * `⌘B` / `[` used to collapse the rail. With no rail to collapse, `[` reverts
 * to its step-previous meaning and the ⌘B binding is retired rather than left
 * bound to nothing.
 */
export function useAppShellShortcuts({
  activeSection,
  features,
  onNavigate,
  onOpenCmdK,
}: {
  activeSection: string;
  features: FeatureConfig[];
  onNavigate: (id: string) => void;
  onOpenCmdK?: () => void;
}): void {
  useEffect(() => {
    let chordTimer: number | null = null;
    let pendingChord: string | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow browser shortcuts (Cmd+C, Cmd+R, Cmd+T, Cmd+W, etc.)
      if (e.metaKey && e.key.toLowerCase() !== 'k') return;
      if (e.ctrlKey && !/^[1-9]$/.test(e.key) && e.key.toLowerCase() !== 'k') return;
      if (isEditingText(e.target)) return;

      const key = e.key;

      // Handle chord continuation (g then t/h/l/r/u/s/p/c/a)
      if (pendingChord === 'g') {
        pendingChord = null;
        if (chordTimer) window.clearTimeout(chordTimer);
        const chordDestinations: Record<string, string> = {
          t: 'today',
          h: 'hr_board',
          l: 'live_games',
          r: 'results',
          u: 'premium',
          b: 'premium',
          s: 'settings',
          p: 'profile',
          c: 'customize',
          a: 'admin',
        };
        const dest = chordDestinations[key.toLowerCase()];
        if (dest) {
          e.preventDefault();
          onNavigate(dest);
          return;
        }
      }

      if (key.toLowerCase() === 'g' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        pendingChord = 'g';
        if (chordTimer) window.clearTimeout(chordTimer);
        chordTimer = window.setTimeout(() => {
          pendingChord = null;
        }, 800);
        return;
      }

      // Quick Search / CmdK
      if ((key === '/' || key === '?') && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onOpenCmdK?.();
        return;
      }

      if ((key.toLowerCase() === 's' || key === ',') && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onNavigate('settings');
        return;
      }

      if (key.toLowerCase() === 'p' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onNavigate('profile');
        return;
      }

      if (!FOCUSED_BETA_SHELL_ENABLED && key.toLowerCase() === 'c' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onNavigate('customize');
        return;
      }

      // Step previous / next through the route tabs
      if ((key === '[' || key === ']') && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (features.length === 0) return;
        const currentIndex = features.findIndex((f) => isNavItemActive(activeSection, f.id));
        const nextIndex = key === ']'
          ? (currentIndex === -1 || currentIndex >= features.length - 1 ? 0 : currentIndex + 1)
          : (currentIndex <= 0 ? features.length - 1 : currentIndex - 1);
        onNavigate(features[nextIndex].id);
        return;
      }

      if (/^[1-9]$/.test(key)) {
        const num = parseInt(key, 10);
        if (num >= 1 && num <= features.length) {
          e.preventDefault();
          onNavigate(features[num - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (chordTimer) window.clearTimeout(chordTimer);
    };
  }, [activeSection, features, onNavigate, onOpenCmdK]);
}
