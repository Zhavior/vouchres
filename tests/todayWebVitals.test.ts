// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import type { Metric } from 'web-vitals';
import {
  createTodayWebVitalDetail,
  isTodayPerformancePage,
  TODAY_CORE_WEB_VITAL_TARGETS,
} from '../src/lib/todayWebVitals';

function metric(name: Metric['name'], value: number): Metric {
  return {
    name,
    value,
    rating: 'good',
    delta: value,
    entries: [],
    id: `metric-${name}`,
    navigationType: 'navigate',
  };
}

describe('Today Core Web Vitals contract', () => {
  it('publishes the requested targets as goals', () => {
    expect(TODAY_CORE_WEB_VITAL_TARGETS).toEqual({ LCP: 2500, INP: 200, CLS: 0.1 });
  });

  it.each([
    ['LCP', 2500, true],
    ['LCP', 2501, false],
    ['INP', 200, true],
    ['INP', 201, false],
    ['CLS', 0.1, true],
    ['CLS', 0.101, false],
  ] as const)('classifies %s at its target boundary', (name, value, meetsTarget) => {
    expect(createTodayWebVitalDetail(metric(name, value))?.meetsTarget).toBe(meetsTarget);
  });

  it('only attributes measurements while the Today marker is mounted', () => {
    expect(isTodayPerformancePage()).toBe(false);
    const marker = document.createElement('section');
    marker.dataset.performancePage = 'today';
    document.body.append(marker);
    expect(isTodayPerformancePage()).toBe(true);
    marker.remove();
  });

  it('does not treat non-Core metrics as Today acceptance metrics', () => {
    expect(createTodayWebVitalDetail(metric('FCP', 800))).toBeNull();
  });
});
