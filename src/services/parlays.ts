// Parlays API service
import { api } from "@/lib/api";

export interface ParlaySuggestion {
  legs: {
    player_id: number;
    player_name: string;
    team_abbr: string;
    opponent_abbr: string;
    game_id: number;
    market: string;
    probability: number;
    confidence: number;
    edge: number;
    risk_tier: string;
  }[];
  combined_confidence: number;
  estimated_payout: number;
  risk_tier: "safe" | "balanced" | "risky" | "lottery";
  ai_warning: string | null;
}

export interface Parlay {
  id: string;
  parlay_type: string;
  risk_tier: string;
  combined_confidence: number;
  estimated_payout: number | null;
  status: "saved" | "locked" | "grading" | "final";
  result: "pending" | "won" | "lost" | "void";
  locked_at: string | null;
  graded_at: string | null;
  legs: {
    id: number | null;
    pick_id: string;
    leg_status: string;
  }[];
  created_at: string;
}

export const parlaysApi = {
  suggest: async (params?: {
    risk_tier?: string;
    game_id?: number;
    limit?: number;
  }): Promise<{ data: ParlaySuggestion[]; meta: any }> => {
    const r = await api.get("/parlays/suggest", { params });
    return r.data;
  },

  create: async (req: {
    leg_pick_ids: string[];
    risk_tier: string;
  }): Promise<Parlay> => {
    const r = await api.post("/parlays/create", req);
    return r.data;
  },

  my: async (params?: { status?: string; limit?: number }): Promise<{ data: Parlay[]; meta: any }> => {
    const r = await api.get("/parlays/my", { params });
    return r.data;
  },

  get: async (parlayId: string): Promise<{ data: any; meta: any }> => {
    const r = await api.get(`/parlays/${parlayId}`);
    return r.data;
  },
};
