import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AppErrorBoundary } from './components/system/AppErrorBoundary';
import AuthStatusBadge from './components/auth/AuthStatusBadge';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <>
      <AuthStatusBadge />
      <App />
    </>
    </AppErrorBoundary>
  </StrictMode>,
);