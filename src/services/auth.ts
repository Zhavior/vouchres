// Auth API service
import { api } from "@/lib/api";

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  region?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserPublic {
  id: string;
  email: string;
  username: string;
  role: "user" | "capper" | "admin";
  region: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface MeResponse {
  user: UserPublic;
  trust_score: number;
  vouch_level: string;
  plan: string;
}

export const authApi = {
  signup: async (req: SignupRequest): Promise<TokenResponse> => {
    const r = await api.post("/auth/signup", req);
    return r.data;
  },

  login: async (req: LoginRequest): Promise<TokenResponse> => {
    const r = await api.post("/auth/login", req);
    return r.data;
  },

  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const r = await api.post("/auth/refresh", { refresh_token: refreshToken });
    return r.data;
  },

  me: async (): Promise<MeResponse> => {
    const r = await api.get("/auth/me");
    return r.data;
  },
};
