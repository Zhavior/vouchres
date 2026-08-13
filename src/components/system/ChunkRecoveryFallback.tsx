import { createRoot, type Root } from 'react-dom/client';
import { VEButton } from '../ui/ve/VEButton';
import { VECard } from '../ui/ve/VECard';
import { VEPageShell } from '../ui/ve/VEPageShell';
import {
  manuallyRecoverFromChunkFailure,
  setChunkRecoveryFallback,
} from '../../lib/chunkRecovery';

let recoveryRoot: Root | null = null;

export function ChunkRecoveryFallback() {
  return (
    <VEPageShell>
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <VECard strong className="w-full max-w-md text-center">
          <p className="terminal-text mb-3 text-vouch-emerald">
            Vouchres
          </p>

          <h1 className="mb-2 text-xl font-black text-white">
            We couldn't finish loading this page
          </h1>

          <p className="mb-5 text-sm leading-relaxed text-white/70">
            Vouchres was updated while this tab was open.
            Refresh to load the latest version.
          </p>

          <VEButton
            type="button"
            className="w-full"
            onClick={manuallyRecoverFromChunkFailure}
          >
            Refresh Vouchres
          </VEButton>
        </VECard>
      </div>
    </VEPageShell>
  );
}

export function mountChunkRecoveryFallback(): void {
  const el = document.getElementById('root');
  if (!el) return;

  recoveryRoot?.unmount();
  recoveryRoot = createRoot(el);
  recoveryRoot.render(<ChunkRecoveryFallback />);
}

/**
 * Register the React-owned recovery UI with the central chunk
 * recovery authority.
 */
export function registerChunkRecoveryFallback(): void {
  setChunkRecoveryFallback(mountChunkRecoveryFallback);
}
