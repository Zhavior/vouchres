const CHUNK_RELOAD_KEY = "vouchedge_chunk_reload_v1";
const CHUNK_FAILED_KEY = "vouchedge_chunk_failed_v1";

const CHUNK_FAILURE_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unexpected token ['"]<['"]|Unexpected token <|is not valid JSON|MIME type.*text\/html/i;

let fallbackHook: (() => void) | null = null;

function safeSessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore quota / privacy mode
  }
}

function safeSessionRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function isChunkRecoveryPending(): boolean {
  return safeSessionGet(CHUNK_RELOAD_KEY) === "1";
}

function isChunkFailureReason(reason: unknown): boolean {
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
        ? reason
        : reason && typeof reason === "object" && "message" in reason
          ? String((reason as { message?: unknown }).message ?? "")
          : "";

  return CHUNK_FAILURE_RE.test(message);
}

function showChunkFallbackUi(): void {
  if (fallbackHook) {
    fallbackHook();
    return;
  }

  const root = document.getElementById("root");
  if (!root) return;

  root.innerHTML = `
    <main class="ve-chunk-recovery-fallback">
      <div class="ve-chunk-recovery-fallback__card">
        <p class="ve-chunk-recovery-fallback__eyebrow">VouchEdge update recovery</p>
        <h1>New version available</h1>
        <p>This tab could not load the latest app bundle after a deploy. Reload once to pick up the new build.</p>
        <button type="button" id="vouchedge-chunk-retry">Reload VouchEdge</button>
      </div>
    </main>
  `;

  const retry = document.getElementById("vouchedge-chunk-retry");
  retry?.addEventListener("click", () => {
    safeSessionRemove(CHUNK_RELOAD_KEY);
    safeSessionRemove(CHUNK_FAILED_KEY);
    window.location.reload();
  });
}

function reloadOnceOnChunkFailure(): void {
  if (safeSessionGet(CHUNK_RELOAD_KEY) === "1") {
    safeSessionSet(CHUNK_FAILED_KEY, "1");
    showChunkFallbackUi();
    return;
  }

  safeSessionSet(CHUNK_RELOAD_KEY, "1");
  window.location.reload();
}

function onUnhandledRejection(event: PromiseRejectionEvent): void {
  if (isChunkFailureReason(event.reason)) {
    event.preventDefault();
    reloadOnceOnChunkFailure();
  }
}

/**
 * Register deploy/chunk recovery listeners before React boots.
 * Covers vite:preloadError, dynamic import failures, and HTML-as-JS responses.
 */
export function initChunkRecovery(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("vite:preloadError", reloadOnceOnChunkFailure);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  if (isChunkRecoveryPending() && safeSessionGet(CHUNK_FAILED_KEY) === "1") {
    showChunkFallbackUi();
  }
}

/**
 * Clear recovery markers on a fresh boot (no pending reload) so stale flags
 * never block a future recovery attempt in the same tab session.
 */
export function clearChunkRecoveryFlag(): void {
  if (typeof window === "undefined") return;
  if (isChunkRecoveryPending()) return;
  safeSessionRemove(CHUNK_RELOAD_KEY);
  safeSessionRemove(CHUNK_FAILED_KEY);
}

/**
 * Call after React mounts successfully — safe to clear the one-reload guard.
 */
export function onChunkRecoveryMountSuccess(): void {
  if (typeof window === "undefined") return;
  safeSessionRemove(CHUNK_RELOAD_KEY);
  safeSessionRemove(CHUNK_FAILED_KEY);
}

/** Optional hook for app-owned fallback UI when chunk recovery fails twice. */
export function setChunkRecoveryFallback(hook: (() => void) | null): void {
  fallbackHook = hook;
}
