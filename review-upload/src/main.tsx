import { lazy, StrictMode, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './components/system/AppErrorBoundary';
import {
  clearChunkRecoveryFlag,
  initChunkRecovery,
  onChunkRecoveryMountSuccess,
} from './lib/chunkRecovery';
import { initSentry } from './lib/sentry';

const SpeedInsights = lazy(() =>
  import('@vercel/speed-insights/react').then((module) => ({ default: module.SpeedInsights })),
);
if (import.meta.env.VITE_SENTRY_DSN) {
  initSentry();
}
initChunkRecovery();
clearChunkRecoveryFlag();

function ChunkRecoveryBootMarker() {
  useEffect(() => {
    onChunkRecoveryMountSuccess();
  }, []);
  return null;
}

function DeferredSpeedInsights() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    const enable = () => {
      timer = window.setTimeout(() => {
        setEnabled(true);
        void import('./lib/registerServiceWorker').then(({ registerServiceWorker }) => {
          void registerServiceWorker();
        });
      }, 3000);
    };

    if (document.readyState === 'complete') {
      enable();
    } else {
      window.addEventListener('load', enable, { once: true });
    }

    return () => {
      window.removeEventListener('load', enable);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  if (!enabled) return null;
  if (!import.meta.env.PROD && import.meta.env.VITE_ENABLE_SPEED_INSIGHTS !== 'true') return null;
  return (
    <Suspense fallback={null}>
      <SpeedInsights />
    </Suspense>
  );
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('VouchEdge root element not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <AppErrorBoundary>
      <ChunkRecoveryBootMarker />
      <App />
      <DeferredSpeedInsights />
    </AppErrorBoundary>
  </StrictMode>,
);
