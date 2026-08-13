// server/services/hr-v2/cache/coalescer.ts

/**
 * Request Coalescer
 * Prevents multiple simultaneous requests for the same resource (e.g., weather for a game)
 * from hitting the upstream provider multiple times.
 */
export class RequestCoalescer {
  private activePromises = new Map<string, Promise<any>>();

  /**
   * Executes the fetcher function. If a fetch for the same key is already in flight,
   * it returns the existing promise instead of starting a new one.
   */
  public async coalesce<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.activePromises.has(key)) {
      return this.activePromises.get(key) as Promise<T>;
    }

    const promise = fetcher().finally(() => {
      this.activePromises.delete(key);
    });

    this.activePromises.set(key, promise);
    return promise;
  }
}

// Global instance for reuse
export const globalCoalescer = new RequestCoalescer();
