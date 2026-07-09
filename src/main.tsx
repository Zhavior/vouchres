import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.tsx';
import './index.css';
import './styles/vouchedge-theme.css';
import { AppErrorBoundary } from './components/system/AppErrorBoundary';
import { forceFounderPoints } from "./lib/founderAccess";
import { queryClient } from './lib/queryClient';
import {
  clearChunkRecoveryFlag,
  initChunkRecovery,
  onChunkRecoveryMountSuccess,
} from './lib/chunkRecovery';
import { initSentry } from './lib/sentry';
import { registerChunkRecoveryFallback } from './components/system/ChunkRecoveryFallback';

import { patchPublicNotificationsFetch } from "./lib/patchPublicNotificationsFetch";

initSentry();
registerChunkRecoveryFallback();
initChunkRecovery();
clearChunkRecoveryFlag();
patchPublicNotificationsFetch();

const scheduleIdle = (fn: () => void) => {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(fn, { timeout: 2000 });
  } else {
    setTimeout(fn, 0);
  }
};
scheduleIdle(forceFounderPoints);

function ChunkRecoveryBootMarker() {
  useEffect(() => {
    onChunkRecoveryMountSuccess();
  }, []);
  return null;
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('VouchEdge root element not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <ChunkRecoveryBootMarker />
        <App />
        <SpeedInsights />
      </AppErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
);
