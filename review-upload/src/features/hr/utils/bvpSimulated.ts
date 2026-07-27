/**
 * Deterministic illustrative BvP history — used only when no reliable pitcher
 * MLB id is available on HrWatchRow. Always labeled "Simulated" in the UI.
 */

export interface BvPLog {
  season: string;
  pa: number;
  hrs: number;
  avg: number;
  slg: number;
  obp: number;
}

function rng(seed: number, n: number) {
  return ((seed * 9301 + 49297 + n * 6547) % 233280) / 233280;
}

function seedOf(s: string) {
  return s.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

export function generateBvPLogs(playerName: string, pitcherName: string): BvPLog[] {
  const s = seedOf(playerName + pitcherName);
  return ['2021', '2022', '2023', '2024', '2025'].map((season, i) => {
    const pa = Math.round(4 + rng(s, i * 3) * 18);
    const hrs = Math.round(rng(s, i * 3 + 1) * Math.min(pa * 0.18, 3));
    const avg = Math.min(+(0.18 + rng(s, i * 3 + 2) * 0.22).toFixed(3), 0.5);
    const slg = Math.min(
      +(avg + 0.08 + (hrs / Math.max(pa, 1)) * 3 + rng(s, i * 7) * 0.15).toFixed(3),
      0.9,
    );
    const obp = Math.min(+(avg + 0.04 + rng(s, i * 5) * 0.09).toFixed(3), 0.6);
    return { season, pa, hrs, avg, slg, obp };
  });
}

export function bvpCareerTotals(logs: BvPLog[]) {
  const t = logs.reduce(
    (a, r) => ({
      pa: a.pa + r.pa,
      hrs: a.hrs + r.hrs,
      avgW: a.avgW + r.avg * r.pa,
      slgW: a.slgW + r.slg * r.pa,
    }),
    { pa: 0, hrs: 0, avgW: 0, slgW: 0 },
  );
  return {
    pa: t.pa,
    hrs: t.hrs,
    avg: t.pa > 0 ? (t.avgW / t.pa).toFixed(3) : '.000',
    slg: t.pa > 0 ? (t.slgW / t.pa).toFixed(3) : '.000',
    hrPct: t.pa > 0 ? ((t.hrs / t.pa) * 100).toFixed(1) : '0.0',
  };
}
