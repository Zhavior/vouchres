import { describe, expect, it, vi } from 'vitest';

const todayDashboard = vi.hoisted(() => vi.fn(() => Promise.resolve({})));

vi.mock('../src/lib/routeModules', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/routeModules')>();
  return {
    ...actual,
    routeModules: {
      ...actual.routeModules,
      todayDashboard,
    },
  };
});

import { isEagerHrSection, preloadSection } from '../src/lib/routePreload';

describe('routePreload after Z8 retirement', () => {
  it("preloadSection('hr_board') is a no-op — retired id has no loader", () => {
    preloadSection('hr_board');
    expect(todayDashboard).not.toHaveBeenCalled();
  });

  it("preloadSection('daily_hr_watch_new') is a no-op — retired id has no loader", () => {
    preloadSection('daily_hr_watch_new');
    expect(todayDashboard).not.toHaveBeenCalled();
  });

  it("preloadSection('hr_intel_v2') is a no-op — page removed", () => {
    preloadSection('hr_intel_v2');
    expect(todayDashboard).not.toHaveBeenCalled();
  });

  it("preloadSection('hr_max') is a no-op — HR pages are eager in the router", () => {
    preloadSection('hr_max');
    expect(todayDashboard).not.toHaveBeenCalled();
  });

  it('treats hr_max as the eager HR section', () => {
    expect(isEagerHrSection('hr_intel_v2')).toBe(false);
    expect(isEagerHrSection('hr_max')).toBe(true);
    expect(isEagerHrSection('today')).toBe(false);
  });

  it('still invokes loaders for sections that are allowed to warm', () => {
    preloadSection('today');
    expect(todayDashboard).toHaveBeenCalledTimes(1);
  });
});
