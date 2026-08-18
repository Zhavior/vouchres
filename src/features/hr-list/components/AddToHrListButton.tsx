/**
 * "Add to my HR list" toggle for HR board rows.
 *
 * Creates a list on first use so adding a player is never gated behind a
 * setup step. The snapshot captured here is what the share card renders, so it
 * takes the board's current values rather than re-deriving them later.
 */
import { useCallback, useState } from 'react';
import { Check, ListPlus, Loader2 } from 'lucide-react';
import { useHrListStore, type HrListPlayerInput } from '../hrListStore';

interface AddToHrListButtonProps {
  player: HrListPlayerInput;
  /** `icon` for dense board rows, `full` for cards and drawers. */
  variant?: 'icon' | 'full';
  className?: string;
}

export function AddToHrListButton({
  player,
  variant = 'full',
  className = '',
}: AddToHrListButtonProps) {
  const activeListId = useHrListStore((s) => s.activeListId);
  const onList = useHrListStore((s) => {
    const list = s.lists.find((item) => item.id === s.activeListId);
    if (!list) return false;
    const key = String(player.playerId);
    return list.entries.some((entry) => String(entry.playerId) === key);
  });

  const addPlayer = useHrListStore((s) => s.addPlayer);
  const removePlayer = useHrListStore((s) => s.removePlayer);
  const createList = useHrListStore((s) => s.createList);

  const [busy, setBusy] = useState(false);

  const toggle = useCallback(async () => {
    setBusy(true);
    try {
      if (onList && activeListId) {
        await removePlayer(activeListId, player.playerId);
        return;
      }
      // First add of the session — spin up a list rather than blocking the user.
      const listId = activeListId ?? (await createList('My HR List'))?.id;
      if (listId) await addPlayer(listId, player);
    } finally {
      setBusy(false);
    }
  }, [activeListId, addPlayer, createList, onList, player, removePlayer]);

  const label = onList
    ? `Remove ${player.playerName} from my HR list`
    : `Add ${player.playerName} to my HR list`;

  const Icon = busy ? Loader2 : onList ? Check : ListPlus;

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label={label}
        aria-pressed={onList}
        title={label}
        className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${
          onList
            ? 'border-emerald-400/45 bg-emerald-400/12 text-emerald-300'
            : 'border-white/12 text-white/50 hover:border-cyan-400/40 hover:text-white'
        } ${className}`}
      >
        <Icon className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={onList}
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${
        onList
          ? 'border-emerald-400/45 bg-emerald-400/12 text-emerald-300'
          : 'border-white/12 text-white/65 hover:border-cyan-400/40 hover:text-white'
      } ${className}`}
    >
      <Icon className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
      {onList ? 'On my HR list' : 'Add to my HR list'}
    </button>
  );
}

export default AddToHrListButton;
