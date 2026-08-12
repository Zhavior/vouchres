import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { recoverFromChunkFailure } from "./chunkRecovery";

export type LazyImport<T extends ComponentType<any>> = () => Promise<{
  default: T;
}>;

export interface LazyWithRetryOptions {
  /**
   * @deprecated Dynamic import retries are not reliable in browsers.
   * Retained temporarily so existing call sites do not break.
   */
  retries?: number;

  /**
   * @deprecated Retained temporarily for API compatibility.
   */
  retryDelayMs?: number;

  /**
   * Allow the centralized chunk recovery system to perform one guarded
   * refresh when a deployment-related chunk failure occurs.
   */
  reloadOnFailure?: boolean;
}

const CHUNK_ERROR_RE =
  /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unexpected token <|MIME type.*text\/html/i;

export function isLazyChunkError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : String(error ?? "");

  return CHUNK_ERROR_RE.test(message);
}

/**
 * React.lazy wrapper with centralized deploy/chunk recovery.
 *
 * Important:
 * - Do not blindly retry dynamic imports. Browsers may cache a failed module
 *   request and Vite documents that network-related dynamic imports cannot be
 *   reliably retried.
 * - Deployment/version-skew failures are handed to chunkRecovery.
 * - The original rejection is still thrown so React's nearest Error Boundary
 *   remains the final fallback if recovery cannot complete.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importer: LazyImport<T>,
  options: LazyWithRetryOptions = {},
): LazyExoticComponent<T> {
  const reloadOnFailure = options.reloadOnFailure ?? true;

  return lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      if (reloadOnFailure && isLazyChunkError(error)) {
        recoverFromChunkFailure();
      }

      throw error;
    }
  });
}
