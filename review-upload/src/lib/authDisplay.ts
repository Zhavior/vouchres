export function hasSupabaseSessionStorage() {
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;
      if (!key.startsWith('sb-') || !key.includes('auth-token')) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const session = parsed?.currentSession ?? parsed;
      return Boolean(session?.access_token && session?.user?.id);
    }
  } catch {
    return false;
  }

  return false;
}

export function isGuestMode() {
  return !hasSupabaseSessionStorage();
}
