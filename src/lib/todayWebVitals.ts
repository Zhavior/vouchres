import type { Metric } from 'web-vitals';

export const TODAY_CORE_WEB_VITAL_TARGETS = Object.freeze({
  LCP: 2_500,
  INP: 200,
  CLS: 0.1,
} as const);

export type TodayCoreWebVitalName = keyof typeof TODAY_CORE_WEB_VITAL_TARGETS;

export interface TodayWebVitalDetail {
  page: 'today';
  name: TodayCoreWebVitalName;
  value: number;
  delta: number;
  id: string;
  navigationType: Metric['navigationType'];
  target: number;
  meetsTarget: boolean;
}

const TODAY_PAGE_SELECTOR = '[data-performance-page="today"]';
const TODAY_WEB_VITAL_EVENT = 'vouchedge:today-web-vital';

let initialized = false;

export function isTodayPerformancePage(documentRef: Pick<Document, 'querySelector'> = document): boolean {
  return documentRef.querySelector(TODAY_PAGE_SELECTOR) !== null;
}

export function createTodayWebVitalDetail(metric: Metric): TodayWebVitalDetail | null {
  if (!(metric.name in TODAY_CORE_WEB_VITAL_TARGETS)) return null;

  const name = metric.name as TodayCoreWebVitalName;
  const target = TODAY_CORE_WEB_VITAL_TARGETS[name];
  const precision = name === 'CLS' ? 3 : 0;

  return {
    page: 'today',
    name,
    value: Number(metric.value.toFixed(precision)),
    delta: Number(metric.delta.toFixed(precision)),
    id: metric.id,
    navigationType: metric.navigationType,
    target,
    meetsTarget: metric.value <= target,
  };
}

function reportTodayWebVital(metric: Metric): void {
  if (!isTodayPerformancePage()) return;

  const detail = createTodayWebVitalDetail(metric);
  if (!detail) return;

  // Always expose a local, PII-free event for diagnostics and automated QA.
  window.dispatchEvent(new CustomEvent<TodayWebVitalDetail>(TODAY_WEB_VITAL_EVENT, { detail }));

  // Product analytics itself enforces the user's analytics-cookie consent.
  void import('./analytics')
    .then(({ trackEvent }) => trackEvent('today_core_web_vital', detail))
    .catch(() => {
      // Performance telemetry must never interfere with the Today experience.
    });
}

/**
 * Registers field Core Web Vitals for the authenticated Today experience.
 * Targets are acceptance goals, not claims about results from a specific device.
 */
export async function initTodayWebVitals(): Promise<void> {
  if (initialized || typeof window === 'undefined' || typeof document === 'undefined') return;
  initialized = true;

  try {
    const { onCLS, onINP, onLCP } = await import('web-vitals');
    const options = { reportAllChanges: true };
    onLCP(reportTodayWebVital, options);
    onINP(reportTodayWebVital, options);
    onCLS(reportTodayWebVital, options);
  } catch {
    // Unsupported browsers and blocked telemetry must remain non-fatal.
  }
}

