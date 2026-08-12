const CHUNK_RELOAD_KEY = "vouchedge_chunk_reload_v2";
const CHUNK_FAILED_KEY = "vouchedge_chunk_failed_v2";
const CHUNK_RECOVERY_STARTED_AT_KEY = "vouchedge_chunk_recovery_started_at_v2";

const RECOVERY_GUARD_TTL_MS = 60_000;

const CHUNK_FAILURE_RE =
  /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unexpected token ['"]<['"]|Unexpected token <|MIME type.*text\/html/i;

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
    // Storage may be unavailable in privacy-restricted environments.
  }
}

function safeSessionRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore unavailable storage.
  }
}

function clearRecoveryMarkers(): void {
  safeSessionRemove(CHUNK_RELOAD_KEY);
  safeSessionRemove(CHUNK_FAILED_KEY);
  safeSessionRemove(CHUNK_RECOVERY_STARTED_AT_KEY);
}

function recoveryGuardExpired(): boolean {
  const raw = safeSessionGet(CHUNK_RECOVERY_STARTED_AT_KEY);
  if (!raw) return false;

  const startedAt = Number(raw);
  if (!Number.isFinite(startedAt)) return true;

  return Date.now() - startedAt > RECOVERY_GUARD_TTL_MS;
}

function normalizeRecoveryGuard(): void {
  if (!recoveryGuardExpired()) return;
  clearRecoveryMarkers();
}

export function isChunkRecoveryPending(): boolean {
  normalizeRecoveryGuard();
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
        <p class="ve-chunk-recovery-fallback__eyebrow">Vouchres</p>
        <h1>We couldn't finish loading this page</h1>
        <p>Vouchres was updated while this tab was open. Refresh to load the latest version.</p>
        <button type="button" id="vouchres-chunk-retry">Refresh Vouchres</button>
      </div>
    </main>
  `;

  const retry = document.getElementById("vouchres-chunk-retry");

  retry?.addEventListener("click", () => {
    clearRecoveryMarkers();
    window.location.reload();
  });
}

function reloadOnceOnChunkFailure(event?: Event): void {
  event?.preventDefault();

  normalizeRecoveryGuard();

  if (safeSessionGet(CHUNK_RELOAD_KEY) === "1") {
    safeSessionSet(CHUNK_FAILED_KEY, "1");
    showChunkFallbackUi();
    return;
  }

  safeSessionSet(CHUNK_RELOAD_KEY, "1");
  safeSessionSet(CHUNK_RECOVERY_STARTED_AT_KEY, String(Date.now()));

  window.location.reload();
}

/**
 * Central recovery authority for deployment-related chunk failures.
 *
 * A chunk failure may indicate that this tab is running an older application
 * build whose hashed assets were removed by a newer deployment.
 *
 * Recovery is intentionally limited to one automatic refresh.
 */
export function recoverFromChunkFailure(): void {
  if (typeof window === "undefined") return;
  reloadOnceOnChunkFailure();
}

function onUnhandledRejection(event: PromiseRejectionEvent): void {
  if (!isChunkFailureReason(event.reason)) return;

  event.preventDefault();
  reloadOnceOnChunkFailure();
}

/**
 * Register recovery listeners before React boots.
 *
 * Covers Vite preload failures and otherwise-unhandled dynamic import
 * rejections while keeping all reload decisions behind one guard.
 */
export function initChunkRecovery(): void {
  if (typeof window === "undefined") return;

  normalizeRecoveryGuard();

  window.addEventListener("vite:preloadError", reloadOnceOnChunkFailure);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  if (
    safeSessionGet(CHUNK_RELOAD_KEY) === "1" &&
    safeSessionGet(CHUNK_FAILED_KEY) === "1"
  ) {
    showChunkFallbackUi();
  }
}

/**
 * Remove stale recovery state when no recovery is currently active.
 */
export function clearChunkRecoveryFlag(): void {
  if (typeof window === "undefined") return;

  normalizeRecoveryGuard();

  if (!isChunkRecoveryPending()) {
    clearRecoveryMarkers();
  }
}

/**
 * Mark a recovered application as healthy.
 *
 * Call this only after the authenticated application has remained mounted
 * long enough that its initial lazy route has had an opportunity to resolve.
 */
export function onChunkRecoveryMountSuccess(): void {
  if (typeof window === "undefined") return;
  clearRecoveryMarkers();
}

/**
 * Keep the recovery guard alive while the application shell and initial lazy
 * route settle. The TTL above prevents abandoned markers from living forever.
 */
export function scheduleChunkRecoveryMountSuccess(
  delayMs = 15_000,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const timer = globalThis.setTimeout(
    onChunkRecoveryMountSuccess,
    Math.max(0, delayMs),
  );

  return () => globalThis.clearTimeout(timer);
}

/**
 * Optional React-owned fallback used when automatic recovery already occurred
 * once and another chunk failure is encountered.
 */
export function setChunkRecoveryFallback(
  hook: (() => void) | null,
): void {
  fallbackHook = hook;
}

/**
 * User-initiated recovery from the fallback UI.
 *
 * Manual recovery intentionally clears the automatic recovery guard first,
 * allowing the refreshed document to start from a clean recovery state.
 */
export function manuallyRecoverFromChunkFailure(): void {
  if (typeof window === "undefined") return;

  clearRecoveryMarkers();
  window.location.reload();
}
