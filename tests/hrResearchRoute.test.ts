// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearHrResearchPlayer,
  isHrResearchHistoryEntry,
  pushHrResearchPlayer,
  readHrResearchPlayerId,
} from '../src/features/hr/utils/hrResearchRoute';

describe('HR player research route state', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/hr-board?mode=confirmed');
  });

  it('adds a shareable player id without removing existing query state', () => {
    pushHrResearchPlayer(592450);

    expect(readHrResearchPlayerId()).toBe('592450');
    expect(new URLSearchParams(window.location.search).get('mode')).toBe('confirmed');
    expect(isHrResearchHistoryEntry()).toBe(true);
  });

  it('moves an HR profile off the stale Today path before opening it', () => {
    window.history.replaceState({ section: 'today' }, '', '/today?mode=curated');

    pushHrResearchPlayer(665742);

    expect(window.location.pathname).toBe('/hr-board');
    expect(readHrResearchPlayerId()).toBe('665742');
    expect(new URLSearchParams(window.location.search).get('mode')).toBe('curated');
    expect(isHrResearchHistoryEntry()).toBe(true);
  });

  it('clears only player research state for direct-link close behavior', () => {
    window.history.replaceState(null, '', '/hr-board?mode=confirmed&hrPlayer=592450');

    clearHrResearchPlayer();

    expect(readHrResearchPlayerId()).toBeNull();
    expect(new URLSearchParams(window.location.search).get('mode')).toBe('confirmed');
    expect(isHrResearchHistoryEntry()).toBe(false);
  });
});
