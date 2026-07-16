const HR_RESEARCH_PLAYER_PARAM = 'hrPlayer';
const HR_RESEARCH_HISTORY_KEY = 'veHrResearch';

export function readHrResearchPlayerId(search = window.location.search): string | null {
  const playerId = new URLSearchParams(search).get(HR_RESEARCH_PLAYER_PARAM)?.trim();
  return playerId || null;
}

export function pushHrResearchPlayer(playerId: string | number): void {
  const currentUrl = new URL(window.location.href);

  // Section navigation can change React state while leaving /today in the
  // address bar. Make HR Board the owning history entry before adding the
  // profile entry, so closing the profile cannot navigate back to Today.
  if (currentUrl.pathname.toLowerCase() !== '/hr-board') {
    currentUrl.pathname = '/hr-board';
    currentUrl.searchParams.delete(HR_RESEARCH_PLAYER_PARAM);
    window.history.replaceState(window.history.state, '', currentUrl);
  }

  const url = new URL(window.location.href);
  url.searchParams.set(HR_RESEARCH_PLAYER_PARAM, String(playerId));
  window.history.pushState(
    { ...(window.history.state ?? {}), [HR_RESEARCH_HISTORY_KEY]: true },
    '',
    url,
  );
}

export function isHrResearchHistoryEntry(): boolean {
  return window.history.state?.[HR_RESEARCH_HISTORY_KEY] === true;
}

export function clearHrResearchPlayer(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete(HR_RESEARCH_PLAYER_PARAM);
  const nextState = { ...(window.history.state ?? {}) };
  delete nextState[HR_RESEARCH_HISTORY_KEY];
  window.history.replaceState(nextState, '', url);
}
