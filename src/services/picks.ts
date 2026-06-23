// Picks API service
import { api } from "@/lib/api";

export interface Pick {
  id: string;
  game_id: number;
  player_id: number;
  market: string;
  line: number;
  status: "saved" | "locked" | "grading" | "final";
  result: "pending" | "won" | "lost" | "push" | "void";
  locked_at: string | null;
  graded_at: string | null;
  created_at: string;
}

export interface SavePickRequest {
  game_id: number;
  player_id: number;
  market: string;
  line?: number;
  model_score_id?: number;
  posted_to_feed?: boolean;
}

export interface UserRecord {
  won: number;
  lost: number;
  push: number;
  void: number;
  decided: number;
  win_rate: number;
  total: number;
  current_streak: number;
}

export interface MarketRecord {
  won: number;
  lost: number;
  push: number;
  void: number;
  decided: number;
  win_rate: number;
}

export const picksApi = {
  save: async (req: SavePickRequest): Promise<Pick> => {
    const r = await api.post("/picks/save", req);
    return r.data;
  },

  my: async (params?: { status?: string; limit?: number }): Promise<{ data: Pick[]; meta: any }> => {
    const r = await api.get("/picks/my", { params });
    return r.data;
  },

  delete: async (pickId: string): Promise<void> => {
    await api.delete(`/picks/${pickId}`);
  },

  grade: async (pickId: string): Promise<any> => {
    const r = await api.post(`/picks/${pickId}/grade`);
    return r.data;
  },

  results: async (): Promise<{
    record: UserRecord;
    by_market: Record<string, MarketRecord>;
  }> => {
    const r = await api.get("/picks/results/my");
    return r.data.data;
  },
};
