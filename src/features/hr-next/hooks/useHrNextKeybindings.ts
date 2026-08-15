import { useEffect } from 'react';
import type { HrNextItem } from './useHrNextData';

interface UseHrNextKeybindingsOptions {
  items: HrNextItem[];
  focusedId: string | null;
  setFocusedId: (id: string) => void;
  onToggleResearch: (player: { id: string | number; name: string }) => void;
  onAddToSlip: (row: any) => void;
  onToggleSaved: (id: string) => void;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onToggleCheatsheet?: () => void;
  onPrevMatchup?: () => void;
  onNextMatchup?: () => void;
  isMatchupMode?: boolean;
}

function isEditingText(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') return true;
  return false;
}

export function useHrNextKeybindings({
  items,
  focusedId,
  setFocusedId,
  onToggleResearch,
  onAddToSlip,
  onToggleSaved,
  isDrawerOpen,
  onCloseDrawer,
  searchInputRef,
  onToggleCheatsheet,
  onPrevMatchup,
  onNextMatchup,
  isMatchupMode = false,
}: UseHrNextKeybindingsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow standard browser shortcuts with Cmd/Ctrl
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const isEditing = isEditingText(e.target);

      // Escape always works even while editing
      if (e.key === 'Escape') {
        if (isEditing) {
          (e.target as HTMLElement).blur();
        } else if (isDrawerOpen) {
          onCloseDrawer();
        }
        return;
      }

      if (isEditing) return;

      // Matchup Slider navigation (Left / Right Arrows or H / L)
      if (isMatchupMode) {
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'h') {
          e.preventDefault();
          onPrevMatchup?.();
          return;
        }
        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'l') {
          e.preventDefault();
          onNextMatchup?.();
          return;
        }
      }

      // Extract all row items (ignore headers)
      const rowItems = items.filter((item): item is Extract<HrNextItem, { type: 'row' }> => item.type === 'row');
      if (rowItems.length === 0) return;

      const currentIndex = rowItems.findIndex(item => item.row.stableId === focusedId);
      const currentRow = currentIndex >= 0 ? rowItems[currentIndex].row : null;

      // Navigation: J / Down Arrow (Next player)
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < rowItems.length - 1 ? currentIndex + 1 : 0;
        const nextRow = rowItems[nextIndex].row;
        setFocusedId(nextRow.stableId);
        return;
      }

      // Navigation: K / Up Arrow (Previous player)
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : rowItems.length - 1;
        const prevRow = rowItems[prevIndex].row;
        setFocusedId(prevRow.stableId);
        return;
      }

      // Toggle Research: Space or Enter
      if (e.key === ' ' || e.key === 'Enter') {
        if (currentRow) {
          e.preventDefault();
          onToggleResearch({ id: currentRow.playerId || currentRow.stableId, name: currentRow.playerName });
        }
        return;
      }

      // Add to Slip: S
      if (e.key.toLowerCase() === 's') {
        if (currentRow) {
          e.preventDefault();
          onAddToSlip(currentRow);
        }
        return;
      }

      // Star / Favorite: F
      if (e.key.toLowerCase() === 'f') {
        if (currentRow) {
          e.preventDefault();
          onToggleSaved(currentRow.stableId);
        }
        return;
      }

      // Focus Search: /
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef?.current?.focus();
        return;
      }

      // Cheatsheet: ?
      if (e.key === '?') {
        e.preventDefault();
        onToggleCheatsheet?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    items,
    focusedId,
    setFocusedId,
    onToggleResearch,
    onAddToSlip,
    onToggleSaved,
    isDrawerOpen,
    onCloseDrawer,
    searchInputRef,
    onToggleCheatsheet,
    onPrevMatchup,
    onNextMatchup,
    isMatchupMode,
  ]);
}
