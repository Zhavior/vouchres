import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import {
  DEPLOY_POLL_INTERVAL_MS,
  fetchDeployedBuildId,
  isBuildIdStale,
  softReloadForDeploy,
} from '../../lib/deployVersion';

export function DeployUpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(async () => {
    const remoteId = await fetchDeployedBuildId();
    setUpdateAvailable(isBuildIdStale(remoteId));
  }, []);

  useEffect(() => {
    void check();

    const interval = window.setInterval(() => void check(), DEPLOY_POLL_INTERVAL_MS);
    const onFocus = () => void check();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void check();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [check]);

  if (!updateAvailable || dismissed) return null;

  return (
    <div
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[120] w-[min(24rem,calc(100vw-1.5rem))] -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div className="ve-card-strong flex items-start gap-3 border border-vouch-cyan/30 bg-obsidian-900/95 p-4 shadow-[0_0_40px_rgba(0,240,255,0.12)] backdrop-blur-md">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-vouch-cyan/30 bg-vouch-cyan/10 text-vouch-cyan">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="terminal-text text-vouch-emerald">Update available</p>
          <p className="mt-1 text-sm font-semibold text-white">A newer VouchEdge build is live.</p>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Reload to pick up the latest deploy without stale bundle errors.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={softReloadForDeploy}
              className="ve-button-primary px-4 py-2 text-xs"
            >
              Reload now
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="ve-button-secondary px-4 py-2 text-xs"
            >
              Later
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg p-1 text-white/40 transition hover:bg-white/5 hover:text-white"
          aria-label="Dismiss update banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
