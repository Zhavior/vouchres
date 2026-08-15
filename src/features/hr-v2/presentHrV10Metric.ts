/** Display helper for board metrics that are not on HrWatchRow. Never invent a number. */
export const UNKNOWN_METRIC = 'UNKNOWN';

export function formatBoardMetric(
  value: number | null | undefined,
  format: (n: number) => string,
): string {
  if (value == null || !Number.isFinite(value)) return UNKNOWN_METRIC;
  return format(value);
}

export function formatGameClock(gameTime: string | null | undefined): string {
  if (!gameTime?.trim()) return 'Time unavailable';
  const iso = Date.parse(gameTime);
  if (Number.isFinite(iso)) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return gameTime.trim();
}

export function americanToImplied(price: number): number {
  if (price > 0) return 100 / (price + 100);
  const abs = Math.abs(price);
  return abs / (abs + 100);
}
