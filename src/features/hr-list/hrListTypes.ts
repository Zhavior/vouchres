/**
 * My HR List — client contract.
 *
 * Mirrors server/services/hr-list/hrListService.ts. Entries are snapshots of
 * what the HR board showed at add time, so a shared list cannot be rewritten
 * after the fact; live board values are shown alongside, never merged in.
 */

export const HR_LIST_MAX_ENTRIES = 25;
export const HR_LIST_MAX_TITLE = 80;
export const HR_LIST_MAX_NOTE = 140;

export interface HrListEntry {
  playerId: number | string;
  playerName: string;
  team?: string | null;
  teamId?: number | string | null;
  opponent?: string | null;
  gamePk?: number | string | null;
  grade?: string | null;
  /** Canonical 0–1 fraction. */
  estimatedHrProb?: number | null;
  bestOdds?: string | null;
  opposingPitcher?: string | null;
  note?: string | null;
  addedAt: string;
}

export type HrListVisibility = 'private' | 'public';

export interface HrList {
  id: string;
  title: string;
  slateDate: string | null;
  entries: HrListEntry[];
  visibility: HrListVisibility;
  firstSharedAt: string | null;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
  /** Non-null only once the list is public. */
  permalink: string | null;
  cardImageUrl: string | null;
}

export interface HrListShareBundle {
  permalink: string;
  cardImageUrl: string;
  /** Prefilled post body, already fitted to X's 280-char budget. */
  text: string;
  /** Opens X's composer with the draft. Never auto-posts. */
  xIntentUrl: string;
}

/** A list that exists only in the browser because the user is signed out. */
export function isLocalHrListId(id: string): boolean {
  return id.startsWith('local:');
}
