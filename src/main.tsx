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
forceFounderPoints();


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
