import { unwrapApiPayload } from '../apiEnvelope';
import { recordHrBoardCacheControl } from '../hrBoardCache';
import { parseHrBoardApiResponse } from '../../api/hrBoardApiContract';
import type { HrBoardResponse } from '../../types/hrBoard';

declare global {
  interface Window {
    __veHrBoardEarly?: Promise<unknown>;
    __veHrBoardEarlyCacheControl?: string | null;
  }
}

/**
 * How long the early payload stays usable. Every first-load consumer (the board
 * query, the guest warm cache) runs well inside this window; anything later is a
 * deliberate refresh and must hit the network for fresh data.
 */
const EARLY_TTL_MS = 15_000;

let parsed: Promise<HrBoardResponse> | null = null;
let claimedAt: number | null = null;

/**
 * Returns the today-board request started by the inline script in index.html.
 *
 * That request goes out during HTML parse, so on a direct load of the HR page it
 * is normally already resolved by the time React mounts — the board renders
 * without a second network round trip after the bundle finishes loading.
 *
 * Every first-load consumer shares one parsed result, so warming the cache and
 * running the board query cost a single request between them. Returns null when
 * there is nothing to claim (any route other than HR, a browser where the inline
 * script did not run, or a call past the TTL) and the caller falls back to its
 * normal loader.
 */
export function claimEarlyHrBoard(): Promise<HrBoardResponse> | null {
  if (typeof window === 'undefined') return null;

  if (parsed) {
    return claimedAt != null && performance.now() - claimedAt <= EARLY_TTL_MS ? parsed : null;
  }

  const early = window.__veHrBoardEarly;
  if (!early) return null;

  claimedAt = performance.now();
  parsed = early.then((body) => {
    recordHrBoardCacheControl(window.__veHrBoardEarlyCacheControl);
    return parseHrBoardApiResponse(unwrapApiPayload(body));
  });

  // The inline script keeps the raw promise alive only until it is claimed.
  delete window.__veHrBoardEarly;
  delete window.__veHrBoardEarlyCacheControl;

  return parsed;
}

export function resetEarlyHrBoardForTests(): void {
  parsed = null;
  claimedAt = null;
}
