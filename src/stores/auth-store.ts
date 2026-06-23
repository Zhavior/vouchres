import { create } from "zustand";
import { authApi, type MeResponse } from "@/services/auth";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  me: MeResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string, region?: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  hasAgeVerified: () => boolean;
}

function getInitialToken(): string | null {
  try {
    return localStorage.getItem("vouchedge_access_token");
  } catch {
    return null;
  }
}

function getInitialRefresh(): string | null {
  try {
    return localStorage.getItem("vouchedge_refresh_token");
  } catch {
    return null;
  }
}

const initialToken = getInitialToken();

export const useAuthStore = create<AuthState>((set, get) => ({
  token: initialToken,
  refreshToken: getInitialRefresh(),
  me: null,
  isLoading: false,
  // Only authenticated if we have a token — will be validated by fetchMe on app load
  isAuthenticated: !!initialToken,

  login: async (email, password) => {
    const tokens = await authApi.login({ email, password });
    localStorage.setItem("vouchedge_access_token", tokens.access_token);
    localStorage.setItem("vouchedge_refresh_token", tokens.refresh_token);
    set({
      token: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isAuthenticated: true,
    });
    // Fetch user profile
    try {
      const me = await authApi.me();
      set({ me });
    } catch {
      // If /me fails after login, don't logout — the token is still valid
      // The user just might not have a profile yet
    }
  },

  signup: async (email, username, password, region) => {
    const tokens = await authApi.signup({ email, username, password, region });
    localStorage.setItem("vouchedge_access_token", tokens.access_token);
    localStorage.setItem("vouchedge_refresh_token", tokens.refresh_token);
    set({
      token: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isAuthenticated: true,
    });
    try {
      const me = await authApi.me();
      set({ me });
    } catch {
      // Profile fetch failed but login succeeded
    }
  },

  logout: () => {
    localStorage.removeItem("vouchedge_access_token");
    localStorage.removeItem("vouchedge_refresh_token");
    set({ token: null, refreshToken: null, me: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    if (!get().token) {
      set({ isAuthenticated: false });
      return;
    }
    try {
      const me = await authApi.me();
      set({ me, isAuthenticated: true });
    } catch {
      // Token might be expired or invalid — logout
      get().logout();
    }
  },

  hasAgeVerified: () => {
    const me = get().me;
    if (!me) return false;
    return true;
  },
}));
