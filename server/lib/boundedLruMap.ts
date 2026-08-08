/**
 * A Map with a hard entry ceiling and least-recently-used eviction.
 *
 * Drop-in for the plain `new Map()` caches that are keyed by user-supplied
 * values. A per-date cache backed by a plain Map is only bounded by how many
 * distinct dates a caller is willing to type — which is not a bound. Each entry
 * here is a whole HR board, so the ceiling is deliberately small: it needs to
 * cover today plus a handful of dates under active research, not a season.
 *
 * Recency is tracked by re-inserting on read, which moves the key to the end of
 * the Map's insertion order. Eviction then takes from the front.
 */
export class BoundedLruMap<K, V> {
  private readonly store = new Map<K, V>();

  constructor(
    private readonly maxEntries: number,
    private readonly name = "lru",
  ) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new Error(`BoundedLruMap(${name}) needs a positive integer capacity`);
    }
  }

  get(key: K): V | undefined {
    const value = this.store.get(key);
    if (value === undefined) return undefined;
    // Touch: delete + re-set moves this key to the most-recent end.
    this.store.delete(key);
    this.store.set(key, value);
    return value;
  }

  /** Read without affecting recency — for callers that are only probing. */
  peek(key: K): V | undefined {
    return this.store.get(key);
  }

  set(key: K, value: V): this {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, value);

    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next();
      if (oldest.done) break;
      this.store.delete(oldest.value);
    }
    return this;
  }

  has(key: K): boolean {
    return this.store.has(key);
  }

  delete(key: K): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  get capacity(): number {
    return this.maxEntries;
  }

  keys(): IterableIterator<K> {
    return this.store.keys();
  }
}
