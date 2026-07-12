declare const __APP_BUILD_ID__: string;

/** Build id baked in at compile time (git short SHA or dev timestamp). */
export const LOCAL_BUILD_ID =
  typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev';

export const DEPLOY_POLL_INTERVAL_MS = 5 * 60 * 1000;

export async function fetchDeployedBuildId(): Promise<string | null> {
  try {
    const res = await fetch(`/build-id.txt?_=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return text || null;
  } catch {
    return null;
  }
}

export function isBuildIdStale(remoteId: string | null, localId: string = LOCAL_BUILD_ID): boolean {
  if (!remoteId) return false;
  return remoteId !== localId;
}

export function softReloadForDeploy(): void {
  window.location.reload();
}
