import { finite } from './truth';

export function formatGameTime(value: string | null | undefined): string {
  if (!value) return 'Time TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time TBD';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatPct(value: number | null | undefined, digits = 1): string {
  const n = finite(value);
  if (n == null) return '—';
  const pct = n <= 1 && n >= 0 ? n * 100 : n;
  return `${pct.toFixed(digits)}%`;
}

export function formatSignedPct(value: number | null | undefined): string {
  const n = finite(value);
  if (n == null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}pp`;
}

export function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return '—';
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}
