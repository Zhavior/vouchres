import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.tsx';
import './index.css';
import './styles/vouchedge-theme.css';
import { AppErrorBoundary } from './components/system/AppErrorBoundary';
import {
  clearChunkRecoveryFlag,
  initChunkRecovery,
  onChunkRecoveryMountSuccess,
} from './lib/chunkRecovery';
if (import.meta.env.VITE_SENTRY_DSN) {
  void import('./lib/sentry').then(({ initSentry }) => initSentry());
}
initChunkRecovery();
clearChunkRecoveryFlag();
void import('./lib/patchPublicNotificationsFetch').then(({ patchPublicNotificationsFetch }) => {
  patchPublicNotificationsFetch();
});

const scheduleIdle = (fn: () => void) => {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(fn, { timeout: 2000 });
  } else {
    setTimeout(fn, 0);
  }
};
scheduleIdle(() => {
  void import('./lib/founderAccess').then(({ forceFounderPoints }) => forceFounderPoints());
});

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
    <AppErrorBoundary>
      <ChunkRecoveryBootMarker />
      <App />
      <SpeedInsights />
    </AppErrorBoundary>
  </StrictMode>,
);
