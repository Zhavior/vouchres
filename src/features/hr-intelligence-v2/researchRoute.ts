const PLAYER_PARAM = 'hrPlayer';
const PATH = '/hr-aurora-max';
const HISTORY_KEY = 'veHrAuroraMaxResearch';

export function readHrAuroraMaxPlayerId(search = window.location.search): string | null {
  const playerId = new URLSearchParams(search).get(PLAYER_PARAM)?.trim();
  return playerId || null;
}

export function pushHrAuroraMaxPlayer(playerId: string | number): void {
  const url = new URL(window.location.href);
  url.pathname = PATH;
  url.searchParams.set(PLAYER_PARAM, String(playerId));
  window.history.pushState({ [HISTORY_KEY]: true }, '', url);
}

export function isHrAuroraMaxHistoryEntry(): boolean {
  return window.history.state?.[HISTORY_KEY] === true;
}

export function clearHrAuroraMaxPlayer(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(PLAYER_PARAM) && url.pathname.toLowerCase() === PATH) return;
  url.pathname = PATH;
  url.searchParams.delete(PLAYER_PARAM);
  window.history.replaceState(window.history.state, '', url);
}
