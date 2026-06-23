// Trust + Leaderboard API service
import { api } from "@/lib/api";

export interface TrustInfo {
  user_id: string;
  username: string;
  trust_score: number;
  vouch_level: string;
  verified_picks: number;
  decided_picks: number;
  win_rate: number;
  current_streak: number;
  market_records: Record<string, {
    won: number;
    lost: number;
    push: number;
    void: number;
    decided: number;
    win_rate: number;
  }>;
  best_markets: { market: string; won: number; lost: number; decided: number; win_rate: number }[];
  components: {
    verified_performance: number;
    volume_factor: number;
    vouch_factor: number;
    streak_factor: number;
    transparency_factor: number;
    penalty_factor: number;
  };
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  trust_score: number;
  vouch_level: string;
  verified_picks: number;
  decided_picks: number;
  won: number;
  lost: number;
  win_rate: number;
  current_streak: number;
  rank: number;
}

export const trustApi = {
  trust: async (userId: string): Promise<{ data: TrustInfo; meta: any }> => {
    const r = await api.get(`/users/${userId}/trust`);
    return r.data;
  },

  profile: async (userId: string): Promise<{ data: any; meta: any }> => {
    const r = await api.get(`/users/${userId}/profile`);
    return r.data;
  },

  leaderboard: async (params?: {
    market?: string;
    period?: string;
    sort?: string;
    limit?: number;
  }): Promise<{ data: LeaderboardEntry[]; meta: any }> => {
    const r = await api.get("/leaderboard", { params });
    return r.data;
  },
};
