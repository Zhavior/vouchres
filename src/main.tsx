import './styles/vouchedge-theme.css';
import './styles/theme-overrides.css';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppErrorBoundary } from './components/system/AppErrorBoundary';
import { bootVouchEdgeTheme } from "./lib/themeEngine";
import { forceFounderPoints } from "./lib/founderAccess";
import { loadSavedTheme } from './theme/themeEngine';
loadSavedTheme();

forceFounderPoints();

bootVouchEdgeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
