// Profile API service
import { api } from "@/lib/api";

export interface ProfileResponse {
  user_id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  favorite_teams: string[];
  preferred_markets: string[];
  mode: string;
  vouch_level: string;
  trust_score: number;
  age_verified: boolean;
  region: string | null;
  created_at: string;
}

export interface UpdateProfileRequest {
  bio?: string;
  avatar_url?: string;
  favorite_teams?: string[];
  preferred_markets?: string[];
  mode?: "beginner" | "advanced";
}

export interface OnboardingRequest {
  favorite_teams: string[];
  preferred_markets: string[];
  mode: "beginner" | "advanced";
  age_confirmed: boolean;
}

export const profileApi = {
  get: async (): Promise<ProfileResponse> => {
    const r = await api.get("/me/profile");
    return r.data;
  },

  update: async (req: UpdateProfileRequest): Promise<ProfileResponse> => {
    const r = await api.put("/me/profile", req);
    return r.data;
  },

  onboard: async (req: OnboardingRequest): Promise<ProfileResponse> => {
    const r = await api.post("/me/onboarding", req);
    return r.data;
  },

  verifyAge: async (): Promise<ProfileResponse> => {
    const r = await api.post("/me/verify-age", { age_confirmed: true });
    return r.data;
  },

  following: async () => {
    const r = await api.get("/me/following");
    return r.data;
  },

  followers: async () => {
    const r = await api.get("/me/followers");
    return r.data;
  },
};
