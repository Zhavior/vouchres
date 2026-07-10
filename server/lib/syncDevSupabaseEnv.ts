/**
 * Mirror server Supabase env vars into VITE_* keys for local dev.
 * Vite only exposes import.meta.env.VITE_* to the browser bundle.
 */
export function syncDevSupabaseEnv(): { clientReady: boolean; missing: string[] } {
  const pairs = [
    ['VITE_SUPABASE_URL', 'SUPABASE_URL'],
    ['VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'],
  ] as const;

  for (const [viteKey, fallbackKey] of pairs) {
    if (!process.env[viteKey]?.trim() && process.env[fallbackKey]?.trim()) {
      process.env[viteKey] = process.env[fallbackKey]!.trim();
    }
  }

  const missing: string[] = [];
  if (!process.env.VITE_SUPABASE_URL?.trim()) missing.push('VITE_SUPABASE_URL (or SUPABASE_URL)');
  if (!process.env.VITE_SUPABASE_ANON_KEY?.trim()) missing.push('VITE_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)');

  return { clientReady: missing.length === 0, missing };
}

export function logDevSupabaseEnvStatus(): void {
  if (process.env.NODE_ENV === 'production') return;
  const { clientReady, missing } = syncDevSupabaseEnv();
  if (clientReady) {
    console.info('[auth] Supabase client env ready for local login.');
    return;
  }
  console.warn(
    `[auth] Local login disabled — missing ${missing.join(' and ')} in .env.local.\n` +
      '       Copy them from Supabase → Project Settings → API (URL + anon public key).\n' +
      '       Also add SUPABASE_SERVICE_ROLE_KEY for server routes that require auth.',
  );
}
