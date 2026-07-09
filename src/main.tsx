import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.tsx';
import './index.css';
import './styles/vouchedge-theme.css';
import { AppErrorBoundary } from './components/system/AppErrorBoundary';
import { forceFounderPoints } from "./lib/founderAccess";
import { queryClient } from './lib/queryClient';

import { patchPublicNotificationsFetch } from "./lib/patchPublicNotificationsFetch";
patchPublicNotificationsFetch();

// After deploy, stale tabs can request deleted hashed chunks; Vercel used to
// return index.html for missing /assets/* (HTML parsed as JS → black screen).
const CHUNK_RELOAD_KEY = "vouchedge_chunk_reload_v1";
const reloadOnceOnChunkFailure = () => {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    window.location.reload();
  } catch {
    window.location.reload();
  }
};

window.addEventListener("vite:preloadError", reloadOnceOnChunkFailure);
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : "";
  if (/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(message)) {
    reloadOnceOnChunkFailure();
  }
});

const scheduleIdle = (fn: () => void) => {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(fn, { timeout: 2000 });
  } else {
    setTimeout(fn, 0);
  }
};
scheduleIdle(forceFounderPoints);


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <App />
        <SpeedInsights />
      </AppErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
);
