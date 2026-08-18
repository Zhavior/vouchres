/**
 * Compatibility surface. The implementation — retry ladder, generation reset,
 * escalation policy — lives in `lazyRoute.tsx`, which owns lazy loading for
 * every code-split surface in the app.
 */
export {
  lazyWithRetry,
  isLazyChunkError,
  type LazyImport,
  type LazyWithRetryOptions,
  type ResilientLazy,
} from './lazyRoute';
