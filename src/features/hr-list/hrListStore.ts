/**
 * My HR List store.
 *
 * Works signed-out: lists live in localStorage under a `local:` id prefix so a
 * user can curate before they have an account. `syncFromServer` adopts server
 * lists on sign-in and pushes any local drafts up once, then the server row is
 * the source of truth for that list.
 *
 * Mutations are optimistic — the UI reorders and adds instantly, and a failed
 * write reverts to the snapshot taken before the change. Sharing is the one
 * action that is never optimistic: it needs the real permalink back from the
 * server before it can hand the user a link.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createHrListRequest,
  deleteHrListRequest,
  fetchHrLists,
  shareHrListRequest,
  updateHrListRequest,
} from './api/hrListApi';
import {
  HR_LIST_MAX_ENTRIES,
  isLocalHrListId,
  type HrList,
  type HrListEntry,
  type HrListShareBundle,
} from './hrListTypes';

/** Input shape accepted by `addPlayer` — anything board-row-like. */
export type HrListPlayerInput = {
  playerId: number | string;
  playerName: string;
  team?: string | null;
  teamId?: number | string | null;
  opponent?: string | null;
  gamePk?: number | string | null;
  grade?: string | null;
  estimatedHrProb?: number | null;
  bestOdds?: string | null;
  opposingPitcher?: string | null;
  note?: string | null;
};

type HrListState = {
  lists: HrList[];
  activeListId: string | null;
  loading: boolean;
  /** Per-list in-flight write flag, keyed by list id. */
  pending: Record<string, boolean>;
  lastError: string | null;
  /** Share bundle for the sheet, cleared on close. */
  share: { listId: string; bundle: HrListShareBundle } | null;
  sharing: boolean;
  syncedAt: string | null;

  setActiveList: (listId: string | null) => void;
  createList: (title: string, slateDate?: string | null) => Promise<HrList | null>;
  renameList: (listId: string, title: string) => Promise<void>;
  removeList: (listId: string) => Promise<void>;
  addPlayer: (listId: string, player: HrListPlayerInput) => Promise<void>;
  removePlayer: (listId: string, playerId: number | string) => Promise<void>;
  reorder: (listId: string, from: number, to: number) => Promise<void>;
  setNote: (listId: string, playerId: number | string, note: string) => Promise<void>;
  shareList: (listId: string) => Promise<HrListShareBundle | null>;
  closeShare: () => void;
  syncFromServer: () => Promise<void>;
  clearError: () => void;
};

const STORAGE_KEY = 'vouchedge.hr-lists.v1';

function nowIso(): string {
  return new Date().toISOString();
}

function localId(): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `local:${rand}`;
}

/** Today in the viewer's timezone as YYYY-MM-DD — slates are calendar days. */
function todaySlate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function normalizeProb(raw: number | null | undefined): number | null {
  if (raw == null || !Number.isFinite(Number(raw))) return null;
  const n = Number(raw);
  if (n <= 0) return null;
  return n > 1 ? Math.min(n, 100) / 100 : n;
}

function toEntry(player: HrListPlayerInput): HrListEntry {
  return {
    playerId: player.playerId,
    playerName: player.playerName,
    team: player.team ?? null,
    teamId: player.teamId ?? null,
    opponent: player.opponent ?? null,
    gamePk: player.gamePk ?? null,
    grade: player.grade ?? null,
    estimatedHrProb: normalizeProb(player.estimatedHrProb),
    bestOdds: player.bestOdds ?? null,
    opposingPitcher: player.opposingPitcher ?? null,
    note: player.note ?? null,
    addedAt: nowIso(),
  };
}

function makeLocalList(title: string, slateDate: string | null): HrList {
  return {
    id: localId(),
    title,
    slateDate,
    entries: [],
    visibility: 'private',
    firstSharedAt: null,
    shareCount: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    permalink: null,
    cardImageUrl: null,
  };
}

function errorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim();
    if (message) return message;
  }
  return fallback;
}

export const useHrListStore = create<HrListState>()(
  persist(
    (set, get) => {
      /**
       * Applies `mutate` optimistically, then persists. Local-only lists skip
       * the network entirely. On failure the pre-change snapshot is restored so
       * the UI never shows a change the server rejected.
       */
      async function commit(
        listId: string,
        mutate: (list: HrList) => HrList,
        persistPatch: (list: HrList) => Promise<HrList>,
        failureMessage: string,
      ): Promise<void> {
        const snapshot = get().lists;
        const target = snapshot.find((list) => list.id === listId);
        if (!target) return;

        const optimistic = mutate({ ...target, updatedAt: nowIso() });
        set({
          lists: snapshot.map((list) => (list.id === listId ? optimistic : list)),
          lastError: null,
        });

        if (isLocalHrListId(listId)) return;

        set((state) => ({ pending: { ...state.pending, [listId]: true } }));
        try {
          const saved = await persistPatch(optimistic);
          set((state) => ({
            lists: state.lists.map((list) => (list.id === listId ? saved : list)),
          }));
        } catch (error) {
          set({ lists: snapshot, lastError: errorMessage(error, failureMessage) });
        } finally {
          set((state) => {
            const pending = { ...state.pending };
            delete pending[listId];
            return { pending };
          });
        }
      }

      return {
        lists: [],
        activeListId: null,
        loading: false,
        pending: {},
        lastError: null,
        share: null,
        sharing: false,
        syncedAt: null,

        setActiveList: (listId) => set({ activeListId: listId }),

        clearError: () => set({ lastError: null }),

        createList: async (title, slateDate = todaySlate()) => {
          const trimmed = title.trim() || 'My HR List';
          const optimistic = makeLocalList(trimmed, slateDate ?? null);

          set((state) => ({
            lists: [optimistic, ...state.lists],
            activeListId: optimistic.id,
            lastError: null,
          }));

          try {
            const saved = await createHrListRequest({ title: trimmed, slateDate });
            set((state) => ({
              // Swap the local placeholder for the server row, keeping position.
              lists: state.lists.map((list) => (list.id === optimistic.id ? saved : list)),
              activeListId: state.activeListId === optimistic.id ? saved.id : state.activeListId,
            }));
            return saved;
          } catch {
            // Signed out or offline — keep the local list, it syncs later.
            return optimistic;
          }
        },

        renameList: async (listId, title) => {
          const trimmed = title.trim();
          if (!trimmed) return;
          await commit(
            listId,
            (list) => ({ ...list, title: trimmed }),
            (list) => updateHrListRequest(listId, { title: list.title }),
            'Could not rename this list.',
          );
        },

        removeList: async (listId) => {
          const snapshot = get().lists;
          set((state) => ({
            lists: state.lists.filter((list) => list.id !== listId),
            activeListId: state.activeListId === listId ? null : state.activeListId,
            lastError: null,
          }));

          if (isLocalHrListId(listId)) return;
          try {
            await deleteHrListRequest(listId);
          } catch (error) {
            set({ lists: snapshot, lastError: errorMessage(error, 'Could not delete this list.') });
          }
        },

        addPlayer: async (listId, player) => {
          const list = get().lists.find((item) => item.id === listId);
          if (!list) return;

          const key = String(player.playerId);
          if (list.entries.some((entry) => String(entry.playerId) === key)) {
            set({ lastError: `${player.playerName} is already on this list.` });
            return;
          }
          if (list.entries.length >= HR_LIST_MAX_ENTRIES) {
            set({ lastError: `A list holds up to ${HR_LIST_MAX_ENTRIES} players.` });
            return;
          }

          await commit(
            listId,
            (current) => ({ ...current, entries: [...current.entries, toEntry(player)] }),
            (current) => updateHrListRequest(listId, { entries: current.entries }),
            `Could not add ${player.playerName}.`,
          );
        },

        removePlayer: async (listId, playerId) => {
          const key = String(playerId);
          await commit(
            listId,
            (current) => ({
              ...current,
              entries: current.entries.filter((entry) => String(entry.playerId) !== key),
            }),
            (current) => updateHrListRequest(listId, { entries: current.entries }),
            'Could not remove that player.',
          );
        },

        reorder: async (listId, from, to) => {
          await commit(
            listId,
            (current) => {
              const entries = [...current.entries];
              if (from < 0 || from >= entries.length || to < 0 || to >= entries.length) {
                return current;
              }
              const [moved] = entries.splice(from, 1);
              entries.splice(to, 0, moved);
              return { ...current, entries };
            },
            (current) => updateHrListRequest(listId, { entries: current.entries }),
            'Could not reorder the list.',
          );
        },

        setNote: async (listId, playerId, note) => {
          const key = String(playerId);
          const trimmed = note.trim();
          await commit(
            listId,
            (current) => ({
              ...current,
              entries: current.entries.map((entry) =>
                String(entry.playerId) === key ? { ...entry, note: trimmed || null } : entry,
              ),
            }),
            (current) => updateHrListRequest(listId, { entries: current.entries }),
            'Could not save that note.',
          );
        },

        shareList: async (listId) => {
          // Never optimistic: the share sheet must show the real permalink.
          if (isLocalHrListId(listId)) {
            set({ lastError: 'Sign in to publish and share this list.' });
            return null;
          }

          set({ sharing: true, lastError: null });
          try {
            const { list, share } = await shareHrListRequest(listId);
            set((state) => ({
              lists: state.lists.map((item) => (item.id === listId ? list : item)),
              share: { listId, bundle: share },
              sharing: false,
            }));
            return share;
          } catch (error) {
            set({ sharing: false, lastError: errorMessage(error, 'Could not publish this list.') });
            return null;
          }
        },

        closeShare: () => set({ share: null }),

        syncFromServer: async () => {
          set({ loading: true });
          try {
            const serverLists = await fetchHrLists();
            const serverIds = new Set(serverLists.map((list) => list.id));

            // Local drafts created while signed out get pushed up once.
            const localDrafts = get().lists.filter((list) => isLocalHrListId(list.id));
            const adopted: HrList[] = [];
            for (const draft of localDrafts) {
              try {
                adopted.push(await createHrListRequest({
                  title: draft.title,
                  slateDate: draft.slateDate,
                  entries: draft.entries,
                }));
              } catch {
                // Keep the draft local; a later sync retries it.
                adopted.push(draft);
              }
            }

            const merged = [
              ...adopted.filter((list) => !serverIds.has(list.id)),
              ...serverLists,
            ];

            set({
              lists: merged,
              loading: false,
              syncedAt: nowIso(),
              activeListId: get().activeListId && merged.some((l) => l.id === get().activeListId)
                ? get().activeListId
                : merged[0]?.id ?? null,
            });
          } catch {
            // Signed out — local lists stay usable.
            set({ loading: false });
          }
        },
      };
    },
    {
      name: STORAGE_KEY,
      // Transient UI state (share sheet, spinners, errors) must not persist.
      partialize: (state) => ({
        lists: state.lists,
        activeListId: state.activeListId,
      }),
    },
  ),
);

export const selectActiveHrList = (state: HrListState): HrList | null =>
  state.lists.find((list) => list.id === state.activeListId) ?? null;

/** True when `playerId` is on the active list — drives the add/remove toggle. */
export const selectIsOnActiveList = (playerId: number | string) => (state: HrListState): boolean => {
  const list = state.lists.find((item) => item.id === state.activeListId);
  if (!list) return false;
  const key = String(playerId);
  return list.entries.some((entry) => String(entry.playerId) === key);
};
