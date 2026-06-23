// Supabase Auth service
import { supabase } from "@/lib/supabaseClient";

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

function sessionToTokenResponse(session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>): TokenResponse {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: session.token_type,
    expires_in: session.expires_in,
  };
}

export const authApi = {
  signup: async (req: SignupRequest): Promise<TokenResponse> => {
    const { data, error } = await supabase.auth.signUp({
      email: req.email,
      password: req.password,
      options: {
        data: {
          username: req.username,
          region: req.region ?? "US-CA",
          role: "user",
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session) {
      throw new Error("Account created. Please check your email to confirm your account, then log in.");
    }

    return sessionToTokenResponse(data.session);
  },

  login: async (req: LoginRequest): Promise<TokenResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: req.email,
      password: req.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session) {
      throw new Error("Login failed. No session returned.");
    }

    return sessionToTokenResponse(data.session);
  },

  refresh: async (): Promise<TokenResponse> => {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session) {
      throw new Error("Could not refresh session.");
    }

    return sessionToTokenResponse(data.session);
  },

  me: async (): Promise<MeResponse> => {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("No authenticated user found.");
    }

    const metadata = data.user.user_metadata ?? {};

    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
        username: metadata.username ?? data.user.email?.split("@")[0] ?? "user",
        role: metadata.role ?? "user",
        region: metadata.region ?? null,
        is_demo: false,
        created_at: data.user.created_at,
      },
      trust_score: 50,
      vouch_level: "Rookie",
      plan: "free",
    };
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  },
};
