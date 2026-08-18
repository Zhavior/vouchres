/**
 * Resilient lazy loading for every code-split surface in the app.
 *
 * The failure this exists to remove: a dynamic import rejects once — a dev
 * server mid-transform, an HMR update that landed while the route was being
 * imported, a deploy that replaced the hashed chunk under a tab, a flaky
 * network — and the route is dead for the rest of the session. `React.lazy`
 * caches the rejected promise on the component type itself, so re-rendering
 * the same lazy component re-throws the same error forever. The only escapes
 * were a full page reload or the app-level error screen.
 *
 * Three mechanisms, applied in order, so a transient import failure never
 * reaches the user:
 *
 *  1. Import-level retry. The importer is re-run with backoff, and the later
 *     attempts re-request the module under a cache-busted URL parsed out of
 *     the failure. A plain retry of the same URL is often useless — the
 *     browser's module map negatively caches the failed URL — so the busted
 *     URL is what actually recovers.
 *  2. Generation reset. If every import attempt fails, a route-scoped
 *     boundary catches the rejection and mints a *new* lazy component type.
 *     A new type has no cached rejection, so the import genuinely runs again.
 *     The route suspends while it does, which shows the same Suspense
 *     skeleton the first load used — no error screen, no layout jump.
 *  3. Escalation. Only after the resets are spent does anything become
 *     visible: production hands off to the guarded single-reload recovery
 *     (the tab is probably running a retired build), and development renders
 *     a route-scoped retry card with the real error instead of taking over
 *     the whole screen.
 *
 * In development there is a fourth path that costs nothing: a failed route
 * re-arms itself on the next successful HMR update. Fix the file that broke
 * the import and the route heals without a reload.
 *
 * Render errors thrown by the loaded page are NOT swallowed — they are
 * re-thrown to the nearest app boundary. This file only owns *loading*.
 */

import React, {
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';
import { recoverFromChunkFailure } from './chunkRecovery';

export type LazyImport<T extends ComponentType<any>> = () => Promise<{
  default: T;
}>;

const CHUNK_ERROR_RE =
  /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unexpected token <|MIME type.*text\/html|Outdated Optimize Dep|outdated dependency/i;

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : String(error ?? '');
}

export function isLazyChunkError(error: unknown): boolean {
  return CHUNK_ERROR_RE.test(messageOf(error));
}

/** Import attempts inside one lazy generation, including the first. */
const IMPORT_ATTEMPTS = 3;
/** Lazy types minted after the initial one before the failure becomes visible. */
const MAX_GENERATIONS = 2;

const IMPORT_BACKOFF_MS = [0, 180, 520];
const GENERATION_BACKOFF_MS = [600, 1400];

function delay(ms: number): Promise<void> {
  return ms > 0
    ? new Promise((resolve) => globalThis.setTimeout(resolve, ms))
    : Promise.resolve();
}

/**
 * Pull the module URL out of a failed dynamic import so the retry can request
 * it again under a URL the browser has not already failed.
 *
 * The tradeoff: a module fetched under a second URL is a second module
 * instance, so a page with module-level side effects runs them twice. That
 * only happens on the recovery path, where the alternative is a route that
 * never loads at all, and its imports still resolve to the shared canonical
 * URLs — only the page module itself is duplicated.
 */
function moduleUrlFromError(error: unknown): string | null {
  const match = /(https?:\/\/[^\s'"()]+)/.exec(messageOf(error));
  return match ? match[1] : null;
}

let bustCounter = 0;

function bustUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl, window.location.href);
    // Vite's own dev timestamp is what went stale; replace it rather than
    // stacking parameters, and keep the rest of the query intact.
    url.searchParams.delete('t');
    url.searchParams.set('ve_retry', String(++bustCounter));
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Run an importer until it resolves or the attempts are spent.
 *
 * Attempt 1 is the plain importer. Later attempts prefer the cache-busted URL
 * because the browser will otherwise replay the cached failure for the
 * original URL without touching the network. Non-chunk errors — a module that
 * throws while evaluating — are re-thrown immediately; retrying those only
 * delays a real bug.
 */
async function importWithRecovery<T extends ComponentType<any>>(
  importer: LazyImport<T>,
): Promise<{ default: T }> {
  let lastError: unknown;

  for (let attempt = 0; attempt < IMPORT_ATTEMPTS; attempt += 1) {
    if (attempt > 0) await delay(IMPORT_BACKOFF_MS[attempt] ?? 520);

    try {
      if (attempt === 0) return await importer();

      const busted =
        typeof window !== 'undefined'
          ? bustUrl(moduleUrlFromError(lastError) ?? '')
          : null;

      if (!busted) return await importer();

      const retried = (await import(/* @vite-ignore */ busted)) as {
        default?: T;
      };

      // A busted URL can resolve to a module Vite served without a default
      // export (an error page, a partial transform). Treat that as a failure
      // rather than mounting `undefined` as a component.
      if (retried?.default) return { default: retried.default };
      return await importer();
    } catch (error) {
      lastError = error;
      if (!isLazyChunkError(error)) throw error;
    }
  }

  throw lastError;
}

/**
 * Dev-only heal channel: a route that failed to import re-arms itself when
 * Vite reports a successful update, so fixing the offending file is enough.
 */
const healListeners = new Set<() => void>();

function subscribeToHeal(listener: () => void): () => void {
  healListeners.add(listener);
  return () => healListeners.delete(listener);
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  const heal = () => {
    for (const listener of [...healListeners]) listener();
  };
  window.addEventListener('vite:afterUpdate', heal);
  window.addEventListener('vite:ws:connect', heal);
}

/**
 * Per-import recovery state.
 *
 * This deliberately lives outside React. An error boundary's own state is not
 * a safe place to keep a retry budget: React unmounts and remounts boundaries
 * around suspended trees, and a remounted boundary would restart the budget
 * (retrying forever) while re-rendering the poisoned first generation. Keeping
 * generation and budget in the closure also means navigating away from a
 * broken route and back lands on the newest generation rather than the failed
 * one.
 */
class LazyGeneration<T extends ComponentType<any>> {
  private readonly cache = new Map<number, LazyExoticComponent<T>>();
  private readonly listeners = new Set<() => void>();
  private timer: ReturnType<typeof globalThis.setTimeout> | null = null;
  private unsubscribeHeal: (() => void) | null = null;

  generation = 0;
  resets = 0;
  exhausted = false;
  lastError: unknown = null;

  constructor(
    private readonly importer: LazyImport<T>,
    private readonly label: string,
    private readonly optional: boolean,
  ) {}

  component(generation: number): LazyExoticComponent<T> {
    let component = this.cache.get(generation);
    if (!component) {
      component = lazy(() => importWithRecovery(this.importer));
      this.cache.set(generation, component);
    }
    return component;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): number => this.generation;

  private emit() {
    for (const listener of [...this.listeners]) listener();
  }

  /** Returns true when another generation is on the way. */
  reportFailure(error: unknown): boolean {
    this.lastError = error;

    // Concurrent boundaries can report the same failure; one recovery per
    // generation is enough.
    if (this.timer !== null) return true;
    if (this.exhausted) return false;

    if (this.resets >= MAX_GENERATIONS) {
      this.exhausted = true;
      console.warn(
        `[lazyRoute] "${this.label}" could not be loaded after ${MAX_GENERATIONS + 1} attempts`,
        error,
      );
      // A tab holding a retired build recovers by fetching the current
      // document. chunkRecovery owns the one-reload guard, so this cannot
      // loop, and it is a no-op for dev HMR noise and optional surfaces.
      if (!this.optional) recoverFromChunkFailure(error);
      this.armHeal();
      this.emit();
      return false;
    }

    console.warn(
      `[lazyRoute] "${this.label}" failed to load; re-arming (${this.resets + 1}/${MAX_GENERATIONS})`,
      error,
    );

    const wait = GENERATION_BACKOFF_MS[this.resets] ?? 1400;
    this.timer = globalThis.setTimeout(() => {
      this.timer = null;
      this.resets += 1;
      this.generation += 1;
      this.emit();
    }, wait);

    return true;
  }

  /** Manual or HMR-driven retry: a fresh budget and a fresh module identity. */
  retry = () => {
    if (this.timer !== null) {
      globalThis.clearTimeout(this.timer);
      this.timer = null;
    }
    this.unsubscribeHeal?.();
    this.unsubscribeHeal = null;
    this.resets = 0;
    this.exhausted = false;
    this.lastError = null;
    this.generation += 1;
    this.emit();
  };

  private armHeal() {
    if (!import.meta.env.DEV || this.unsubscribeHeal) return;
    this.unsubscribeHeal = subscribeToHeal(this.retry);
  }
}

type BoundaryProps = {
  children: React.ReactNode;
  pendingFallback: React.ReactNode;
  label: string;
  optional: boolean;
  /** Reports the failure and answers whether another generation is coming. */
  onChunkFailure: (error: unknown) => boolean;
  onRetry: () => void;
};

type BoundaryState = {
  error: unknown;
  /** True while a fresh generation is on its way, so the skeleton stays up. */
  recovering: boolean;
};

/**
 * Catches the rejected import for one generation only. A new generation gets a
 * new boundary instance (keyed by generation upstream), which is what lets the
 * retry budget stay in the controller rather than in React state.
 */
class LazyChunkBoundary extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, recovering: false };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error, recovering: isLazyChunkError(error) };
  }

  componentDidCatch(error: unknown) {
    if (!isLazyChunkError(error)) return;
    const recovering = this.props.onChunkFailure(error);
    if (!recovering) this.setState({ recovering: false });
  }

  render() {
    const { error, recovering } = this.state;

    // Render errors thrown by the loaded module are not this boundary's
    // business — they belong to the app-level boundary.
    if (error && !isLazyChunkError(error)) throw error;

    if (error && recovering) return this.props.pendingFallback;

    // Optional surfaces (telemetry, decoration) leave nothing behind.
    if (error && this.props.optional) return null;

    if (error) {
      return (
        <div
          role="alert"
          className="mx-auto flex w-full max-w-xl flex-col items-start gap-3 px-4 py-10 text-slate-200"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            {this.props.label}
          </p>
          <p className="text-sm text-white/70">
            This view couldn&apos;t finish loading. Everything else is still running.
          </p>
          <button
            type="button"
            onClick={this.props.onRetry}
            className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-300"
          >
            Try again
          </button>
          {import.meta.env.DEV && (
            <p className="break-words font-mono text-[11px] text-red-200/80">
              {messageOf(error)}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export interface LazyWithRetryOptions {
  /** @deprecated Retry policy is owned by this module. */
  retries?: number;
  /** @deprecated Retry policy is owned by this module. */
  retryDelayMs?: number;
  /** @deprecated Escalation is owned by this module. */
  reloadOnFailure?: boolean;
  /** Shown while a failed import is being retried. Defaults to nothing. */
  pendingFallback?: React.ReactNode;
  /** Name used in recovery copy and console diagnostics. */
  label?: string;
  /**
   * Mark non-essential surfaces (telemetry, decoration). They fail silently
   * instead of showing a retry card or escalating to a page reload.
   */
  optional?: boolean;
}

export type ResilientLazy<T extends ComponentType<any>> =
  React.FC<React.ComponentProps<T>> & { preload: () => void };

/**
 * Drop-in `React.lazy` replacement carrying the recovery policy above.
 *
 * Returns a plain component rather than a `LazyExoticComponent`: the exported
 * identity has to stay stable while the lazy type underneath is replaced.
 * Resolved generations stay cached, so navigating away and back reuses the
 * loaded module instead of re-suspending.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importer: LazyImport<T>,
  options: LazyWithRetryOptions = {},
): ResilientLazy<T> {
  const label = options.label ?? 'View';
  const controller = new LazyGeneration(importer, label, options.optional ?? false);

  function ResilientLazyComponent(props: React.ComponentProps<T>) {
    const generation = React.useSyncExternalStore(
      controller.subscribe,
      controller.getSnapshot,
      controller.getSnapshot,
    );

    const Component = controller.component(generation);

    return (
      <LazyChunkBoundary
        key={generation}
        label={label}
        optional={options.optional ?? false}
        pendingFallback={options.pendingFallback ?? null}
        onChunkFailure={(error) => controller.reportFailure(error)}
        onRetry={controller.retry}
      >
        <Component {...props} />
      </LazyChunkBoundary>
    );
  }

  ResilientLazyComponent.displayName = `Lazy(${label})`;

  // Warming path for routePreload / hover intent. Failures are ignored here:
  // the real mount goes through the retry ladder above.
  ResilientLazyComponent.preload = () => {
    void importer().catch(() => undefined);
  };

  return ResilientLazyComponent as ResilientLazy<T>;
}
