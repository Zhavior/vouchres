import { describe, expect, it, vi } from 'vitest';

const todayDashboard = vi.hoisted(() => vi.fn(() => Promise.resolve({})));
const parlayOs = vi.hoisted(() => vi.fn(() => Promise.resolve({})));
const resultsStudio = vi.hoisted(() => vi.fn(() => Promise.resolve({})));
const nflTouchdown = vi.hoisted(() => vi.fn(() => Promise.resolve({})));
const prefetchQuery = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock('../src/lib/queryClient', () => ({
  queryClient: { prefetchQuery },
}));

vi.mock('../src/lib/routeModules', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/routeModules')>();
  return {
    ...actual,
    routeModules: {
      ...actual.routeModules,
      todayDashboard,
      parlayOs,
      results: resultsStudio,
      nflTouchdown,
    },
  };
});

import { isEagerHrSection, preloadSection } from '../src/lib/routePreload';

describe('routePreload', () => {
  it("preloadSection('hr_intel_v2') is a no-op — page removed", () => {
    preloadSection('hr_intel_v2');
    expect(todayDashboard).not.toHaveBeenCalled();
  });

  it("preloadSection('hr_max') is a no-op — HR pages are eager in the router", () => {
    preloadSection('hr_max');
    expect(todayDashboard).not.toHaveBeenCalled();
  });

  it("preloadSection('hr_v10') is a no-op — V10 is eager in the router", () => {
    preloadSection('hr_v10');
    expect(todayDashboard).not.toHaveBeenCalled();
  });

  it('treats eager HR desks as eager — never prefetch', () => {
    expect(isEagerHrSection('hr_intel_v2')).toBe(false);
    expect(isEagerHrSection('hr_max')).toBe(true);
    expect(isEagerHrSection('aurora_hr_hq')).toBe(true);
    expect(isEagerHrSection('aurora_daily_slate')).toBe(true);
    expect(isEagerHrSection('hr_v10')).toBe(true);
    expect(isEagerHrSection('today')).toBe(false);
  });

  it('still invokes loaders for sections that are allowed to warm', () => {
    preloadSection('today');
    expect(todayDashboard).toHaveBeenCalledTimes(1);
  });

  it('warms the TD Next route and both connection queries together', async () => {
    preloadSection('td_next');
    await vi.waitFor(() => {
      expect(nflTouchdown).toHaveBeenCalledTimes(1);
      expect(prefetchQuery).toHaveBeenCalledTimes(2);
    });
  });

  it('warms the Parlay OS chunk from every one of its doors', () => {
    // build / live_parlays / results were three routes and are now one page, so
    // all three must warm the workspace chunk. `results` in particular used to
    // fetch a standalone ResultsStudio module that the route no longer mounts.
    // `preloaded` dedupes per section for the module's lifetime, so each
    // section is warmed exactly once here — a second call would be a no-op.
    for (const section of ['build', 'live_parlays', 'results']) {
      parlayOs.mockClear();
      preloadSection(section);
      expect(parlayOs, `${section} should warm the Parlay OS chunk`).toHaveBeenCalledTimes(1);
    }

    // `results` opens straight onto the tab that lazy-loads ResultsStudio, so
    // it warms that chunk too — otherwise the page shell renders first and the
    // panel's skeleton appears a moment later.
    expect(resultsStudio).toHaveBeenCalledTimes(1);
  });
});
