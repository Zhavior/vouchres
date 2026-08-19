/**
 * HrWatchRow → HR list snapshot.
 *
 * The board row carries far more than a list entry needs. This picks only what
 * the list and its share card render, and it runs at add time on purpose: the
 * entry is a record of what the board said then, not a live pointer.
 */
import type { HrWatchRow } from '../../hr/types/hrWatch';
import type { HrListPlayerInput } from '../hrListStore';
import { teamIdByName } from '../../../lib/teamLogos';

/**
 * HRPI bands, mirroring utils/tierPartition. Kept as a letter grade because the
 * share card and the permalink both read as a scouting list, where A/B/C is
 * legible to a reader who has never seen the board.
 */
function gradeFromScore(score: number | null | undefined): string | null {
  if (score == null || !Number.isFinite(Number(score))) return null;
  const n = Number(score);
  if (n >= 85) return 'A+';
  if (n >= 78) return 'A';
  if (n >= 70) return 'B';
  if (n >= 60) return 'C';
  return 'D';
}

/** Formats American odds the way the board labels them (+285 / -110). */
function formatOdds(row: HrWatchRow): string | null {
  if (row.bookOdds != null && Number.isFinite(Number(row.bookOdds))) {
    const n = Number(row.bookOdds);
    return n > 0 ? `+${n}` : String(n);
  }
  const label = String(row.oddsLabel ?? '').trim();
  // The board uses these placeholders when no book price is available; a share
  // card must not present them as a price.
  if (!label || /^(tbd|n\/?a|—|-)$/i.test(label)) return null;
  return label;
}

export function hrWatchRowToListEntry(row: HrWatchRow): HrListPlayerInput | null {
  // Without a player id there is no headshot and no stable identity, so the
  // row cannot become a list entry.
  if (row.playerId == null || String(row.playerId).trim() === '') return null;

  return {
    playerId: row.playerId,
    playerName: row.playerName,
    team: row.team ?? null,
    teamId: teamIdByName(row.team),
    opponent: row.opponent ?? null,
    gamePk: row.gamePk ?? null,
    grade: gradeFromScore(row.hrScore),
    estimatedHrProb: row.hrProbability ?? null,
    bestOdds: formatOdds(row),
    opposingPitcher: row.pitcherName ?? null,
    note: null,
  };
}
