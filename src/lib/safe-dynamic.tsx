/**
 * safe-dynamic — ChunkLoadError auto-reload wrapper.
 *
 * NOTE: This project is Vite-based (not Next.js), so we implement the retry
 * logic directly rather than delegating to next/dynamic.
 *
 * Usage (optional — the aurora_hr_hq route is statically imported and never
 * split, so this utility exists for other dynamic-import call sites):
 *
 *   const MyComp = safeDynamic(() => import('./MyComp'));
 */

import { Suspense, lazy, type ComponentType } from 'react';

export function safeDynamic<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options?: { fallback?: React.ReactNode },
) {
  const LazyComponent = lazy(() =>
    importFn().catch((error: unknown) => {
      const err = error as { name?: string; message?: string };
      if (
        err?.name === 'ChunkLoadError' ||
        err?.message?.includes('Loading chunk') ||
        err?.message?.includes('Failed to fetch dynamically imported module')
      ) {
        if (typeof window !== 'undefined') window.location.reload();
      }
      throw error;
    }),
  );

  return function SafeDynamicWrapper(props: T) {
    return (
      <Suspense fallback={options?.fallback ?? <SkeletonLoader />}>
        <LazyComponent {...props} />
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
