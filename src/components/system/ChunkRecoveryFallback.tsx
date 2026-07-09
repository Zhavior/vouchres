import { createRoot, type Root } from 'react-dom/client';
import { VEButton } from '../ui/ve/VEButton';
import { VECard } from '../ui/ve/VECard';
import { VEPageShell } from '../ui/ve/VEPageShell';
import { setChunkRecoveryFallback } from '../../lib/chunkRecovery';

const CHUNK_RELOAD_KEY = 'vouchedge_chunk_reload_v1';
const CHUNK_FAILED_KEY = 'vouchedge_chunk_failed_v1';

let recoveryRoot: Root | null = null;

function clearRecoveryFlags(): void {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    sessionStorage.removeItem(CHUNK_FAILED_KEY);
  } catch {
    // ignore quota / privacy mode
  }
}

export function ChunkRecoveryFallback() {
  return (
    <VEPageShell>
      <div className="flex min-h-[80vh] items-center justify-center">
        <VECard strong className="w-full max-w-md text-center">
          <p className="terminal-text mb-3 text-vouch-emerald">VouchEdge update recovery</p>
          <h1 className="mb-2 text-xl font-black text-white">New version available</h1>
          <p className="mb-5 text-sm leading-relaxed text-white/70">
            This tab could not load the latest app bundle after a deploy. Reload once to pick up the new build.
          </p>
          <VEButton
            type="button"
            className="w-full"
            onClick={() => {
              clearRecoveryFlags();
              window.location.reload();
            }}
          >
            Reload VouchEdge
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

/** Register themed React fallback before chunk recovery boots. */
export function registerChunkRecoveryFallback(): void {
  setChunkRecoveryFallback(() => mountChunkRecoveryFallback());
}
