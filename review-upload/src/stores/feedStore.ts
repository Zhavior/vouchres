import { create } from 'zustand';
import type { FeedPost } from '../types';
import { INITIAL_POSTS } from '../data/mockData';
import { accountStorageKey } from '../lib/accountStorage';

const STORAGE_KEY = 'vouchedge_posts';

type FeedState = {
  posts: FeedPost[];
  syncPosts: (posts: FeedPost[]) => void;
  hydrateFromStorage: () => void;
  resetPosts: () => void;
};

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],

  syncPosts: (posts) => {
    try {
      localStorage.setItem(accountStorageKey(STORAGE_KEY), JSON.stringify(posts));
    } catch {
      // ignore storage failures
    }
    set({ posts });
  },

  hydrateFromStorage: () => {
    try {
      const stored = localStorage.getItem(accountStorageKey(STORAGE_KEY));
      if (stored) {
        set({ posts: JSON.parse(stored) });
        return;
      }
      localStorage.setItem(accountStorageKey(STORAGE_KEY), JSON.stringify(INITIAL_POSTS));
      set({ posts: INITIAL_POSTS });
    } catch {
      set({ posts: INITIAL_POSTS });
    }
  },

  resetPosts: () => {
    try {
      localStorage.setItem(accountStorageKey(STORAGE_KEY), JSON.stringify(INITIAL_POSTS));
    } catch {
      // ignore storage failures
    }
    set({ posts: INITIAL_POSTS });
  },
}));

export const selectPosts = (state: FeedState) => state.posts;
export const selectSyncPosts = (state: FeedState) => state.syncPosts;
