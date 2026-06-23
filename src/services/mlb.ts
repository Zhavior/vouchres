// MLB API service
import { api } from "@/lib/api";

export interface Game {
  id: number;
  away_id: number;
  home_id: number;
  away_abbr: string;
  home_abbr: string;
  away_name?: string;
  home_name?: string;
  away_score?: number | null;
  home_score?: number | null;
  venue: string | null;
  scheduled_first_pitch: string;
  status: "scheduled" | "pre" | "live" | "delayed" | "final" | "postponed" | "cancelled";
  status_detail?: string;
  probable_pitcher_away?: number | null;
  probable_pitcher_home?: number | null;
  weather?: { temp?: string; wind?: string; condition?: string } | null;
  lineup_confirmed: boolean;
  inning?: number | null;
  inning_state?: string | null;
  data_fresh_at: string | null;
  is_stale: boolean;
}

export interface PickCard {
  player_id: number;
  player_name: string;
  team_abbr: string;
  opponent_abbr: string;
  game_id: number;
  market: string;
  line: number;
  probability: number;
  confidence: number;
  edge: number;
  risk_tier: "low" | "medium" | "high" | "lottery";
  model_version: string;
  reasoning: string;
  reasoning_long: {
    factors: { name: string; value: number; direction: string; impact: string }[];
    matchup: string;
    warning: string | null;
    probability: number;
    confidence: number;
    edge: number;
    risk_tier: string;
    model_version: string;
  };
  headshot_url: string | null;
  venue: string | null;
  scheduled_first_pitch: string;
  pitcher_matchup: string | null;
  fetched_at: string;
  is_stale: boolean;
}

export interface GameResearch extends Game {
  park_factor: number;
  injuries: any[];
  top_targets: any[];
  weather_warning: string | null;
}

export interface PlayerDetail {
  id: number;
  name: string;
  team_id: number | null;
  team_name?: string;
  position: string | null;
  bats: string | null;
  throws: string | null;
  headshot_url: string | null;
  recent_form: {
    group: string;
    season: string | null;
    avg: string | null;
    hr: number | null;
    rbi: number | null;
    ops: string | null;
    games: number | null;
  }[];
  splits: Record<string, any>;
}

export const mlbApi = {
  gamesToday: async (date?: string): Promise<{ data: Game[]; meta: any }> => {
    const r = await api.get("/mlb/games/today", { params: { date } });
    return r.data;
  },

  gamesLive: async (): Promise<{ data: Game[]; meta: any }> => {
    const r = await api.get("/mlb/games/live");
    return r.data;
  },

  gameResearch: async (gameId: number): Promise<{ data: GameResearch; meta: any }> => {
    const r = await api.get(`/mlb/games/${gameId}/research`);
    return r.data;
  },

  player: async (playerId: number): Promise<{ data: PlayerDetail; meta: any }> => {
    const r = await api.get(`/mlb/players/${playerId}`);
    return r.data;
  },

  picksToday: async (params?: {
    market?: string;
    min_conf?: number;
    min_edge?: number;
    sort?: string;
    game_id?: number;
    limit?: number;
  }): Promise<{ data: PickCard[]; meta: any }> => {
    const r = await api.get("/mlb/picks/today", { params });
    return r.data;
  },

  hrTargets: async (limit?: number): Promise<{ data: PickCard[]; meta: any }> => {
    const r = await api.get("/mlb/hr-targets", { params: { limit } });
    return r.data;
  },
};
