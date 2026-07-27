/** Shared copy for profile win-rate surfaces — avoid showing 0% before any graded picks. */

export function profileHasGradedPicks(profile: { totalPicks?: number | null }): boolean {
  return (profile.totalPicks ?? 0) > 0;
}

export function formatProfileWinRate(
  profile: { winRate: number; totalPicks?: number | null },
  opts?: { suffix?: string; decimals?: number },
): string {
  if (!profileHasGradedPicks(profile)) return 'No graded picks yet';
  const decimals = opts?.decimals ?? 1;
  const suffix = opts?.suffix?.trim();
  const rate = `${profile.winRate.toFixed(decimals)}%`;
  return suffix ? `${rate} ${suffix}` : rate;
}

export function formatProfileWinRateShort(profile: { winRate: number; totalPicks?: number | null }): string {
  if (!profileHasGradedPicks(profile)) return 'No graded picks yet';
  return `${profile.winRate.toFixed(1)}% WR`;
}
