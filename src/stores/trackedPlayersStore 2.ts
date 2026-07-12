import { create } from "zustand";

const STORAGE_KEY = "vouchedge_tracked_players";

export type TrackedPlayer = {
  playerName: string;
  trackedAt: number;
};

type TrackedPlayersState = {
  players: TrackedPlayer[];
  trackPlayer: (playerName: string) => void;
  untrackPlayer: (playerName: string) => void;
  isTracked: (playerName: string) => boolean;
  hydrate: () => void;
};

export const useTrackedPlayersStore = create<TrackedPlayersState>((set, get) => ({
  players: [],

  trackPlayer: (playerName) => {
    const existing = get().players;

    if (existing.some((p) => p.playerName === playerName)) {
      return;
    }

    const updated = [
      ...existing,
      {
        playerName,
        trackedAt: Date.now(),
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    set({
      players: updated,
    });
  },

  untrackPlayer: (playerName) => {
    const updated = get().players.filter(
      (p) => p.playerName !== playerName
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    set({
      players: updated,
    });
  },

  isTracked: (playerName) => {
    return get().players.some(
      (p) => p.playerName === playerName
    );
  },

  hydrate: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        set({
          players: JSON.parse(stored),
        });
      }
    } catch {
      set({
        players: [],
      });
    }
  },
}));
