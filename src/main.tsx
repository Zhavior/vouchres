import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppErrorBoundary } from './components/system/AppErrorBoundary';
import { bootVouchEdgeTheme } from "./lib/themeEngine";
import { forceFounderPoints } from "./lib/founderAccess";

forceFounderPoints();

bootVouchEdgeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
