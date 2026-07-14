/**
 * Structured team-assignment safety for HR honesty.
 * Prefer team IDs over name|abbrev handlists (e.g. former BAD_PAIRINGS).
 */

export const TEAM_MISMATCH_REASON = "Team mismatch / stale roster assignment";

export type TeamAssignmentIds = {
  /** Team this row is being scored/displayed for (game slate team). */
  teamId?: number | null;
  /** Team that sourced the roster row. */
  sourceTeamId?: number | null;
  /** Active roster team at fetch time. */
  activeRosterTeamId?: number | null;
  /** MLB people.currentTeam.id when available. */
  currentTeamId?: number | null;
  /** Alias used by validated pipeline TodayPlayer. */
  playerCurrentTeamId?: number | null;
};

function asId(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Returns true when available team IDs disagree.
 * Missing optional IDs are ignored; only present values can fail closed.
 */
export function hasTeamAssignmentMismatch(input: TeamAssignmentIds): boolean {
  const teamId = asId(input.teamId);
  const sourceTeamId = asId(input.sourceTeamId) ?? teamId;
  const activeRosterTeamId = asId(input.activeRosterTeamId);
  const currentTeamId = asId(input.currentTeamId) ?? asId(input.playerCurrentTeamId);

  if (teamId == null || sourceTeamId == null) return false;
  if (teamId !== sourceTeamId) return true;
  if (activeRosterTeamId != null && activeRosterTeamId !== sourceTeamId) return true;
  if (currentTeamId != null && currentTeamId !== sourceTeamId) return true;
  return false;
}

export function teamAssignmentMismatchDetail(input: TeamAssignmentIds): string {
  return [
    `teamId=${asId(input.teamId) ?? "unknown"}`,
    `sourceTeamId=${asId(input.sourceTeamId) ?? "unknown"}`,
    `activeRosterTeamId=${asId(input.activeRosterTeamId) ?? "unknown"}`,
    `currentTeamId=${asId(input.currentTeamId) ?? asId(input.playerCurrentTeamId) ?? "unknown"}`,
  ].join(", ");
}
