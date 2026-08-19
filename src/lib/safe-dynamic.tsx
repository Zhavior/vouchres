/**
 * safe-dynamic — Suspense + skeleton wrapper over the app's resilient lazy
 * loader.
 *
 * Recovery policy is not duplicated here: `lazyWithRetry` (see lazyRoute.tsx)
 * owns the retry ladder, the generation reset and the escalation rules, so a
 * panel loaded through this helper recovers exactly like a routed page.
 *
 * Usage (optional — the aurora_hr_hq route is statically imported and never
 * split, so this utility exists for other dynamic-import call sites):
 *
 *   const MyComp = safeDynamic(() => import('./MyComp'));
 */

import { Suspense, type ComponentType } from 'react';
import { lazyWithRetry } from './lazyWithRetry';

export function safeDynamic<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options?: { fallback?: React.ReactNode; label?: string },
) {
  const LazyComponent = lazyWithRetry(importFn, {
    label: options?.label ?? 'Panel',
    pendingFallback: options?.fallback ?? <SkeletonLoader />,
  });

  return function SafeDynamicWrapper(props: T) {
    return (
      <Suspense fallback={options?.fallback ?? <SkeletonLoader />}>
        <LazyComponent {...(props as React.ComponentProps<ComponentType<T>>)} />
      </Suspense>
    );
  };
}

export function SkeletonLoader() {
  return (
    <div
      style={{
        width: '100%',
        minHeight: '24rem',
        padding: '1.5rem',
        borderRadius: '1rem',
        border: '1px solid rgba(30,41,59,0.8)',
        background: 'rgba(2,6,23,0.8)',
        animation: 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
      }}
    >
      <div style={{ height: '2rem', width: '25%', borderRadius: '0.375rem', background: 'rgba(30,41,59,0.6)', marginBottom: '1.5rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))', gap: '1rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: '16rem', borderRadius: '0.75rem', border: '1px solid rgba(30,41,59,0.5)', background: 'rgba(15,23,42,0.5)' }} />
        ))}
      </div>
    </div>
  );
}
