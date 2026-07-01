import type { VercelRequest } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export function getBearerToken(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (typeof header !== "string" || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export async function requireUser(req: VercelRequest) {
  const token = getBearerToken(req);
  if (!token) return { user: null, client: null, error: "missing_token" };

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return { user: null, client: null, error: "supabase_not_configured" };
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { user: null, client, error: "invalid_token" };

  return { user: data.user, client, error: null };
}

export function normalizeLimit(value: unknown, fallback = 50, max = 100) {
  const n = Number(value ?? fallback);
  return Math.max(1, Math.min(Number.isFinite(n) ? n : fallback, max));
}

export function normalizeOffset(value: unknown) {
  const n = Number(value ?? 0);
  return Math.max(0, Number.isFinite(n) ? n : 0);
}
