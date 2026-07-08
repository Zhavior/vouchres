import './styles/vouchedge-performance-skin.css';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppErrorBoundary } from './components/system/AppErrorBoundary';
import { forceFounderPoints } from "./lib/founderAccess";

import { patchPublicNotificationsFetch } from "./lib/patchPublicNotificationsFetch";
patchPublicNotificationsFetch();
forceFounderPoints();


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
