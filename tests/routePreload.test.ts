import { describe, expect, it, vi } from 'vitest';

const todayDashboard = vi.hoisted(() => vi.fn(() => Promise.resolve({})));
const resultsStudio = vi.hoisted(() => vi.fn(() => Promise.resolve({})));

vi.mock('../src/lib/routeModules', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/routeModules')>();
  return {
    ...actual,
    routeModules: {
      ...actual.routeModules,
      todayDashboard,
      results: resultsStudio,
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
    preloadSection('results');
    expect(resultsStudio).toHaveBeenCalledTimes(1);
  });
});
