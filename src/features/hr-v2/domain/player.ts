export type PlayerHandedness = 'L' | 'R' | 'S';

export interface PlayerIdentity {
  id: string; // Stable entity ID
  mlbId?: string; // Official numeric MLB person id (e.g. "592450")
  name: string;
  teamId: string;
  teamAbbreviation: string;
  handedness: PlayerHandedness;
  /** Jersey number from the active roster entry (e.g. "99"). */
  jerseyNumber?: string;
  /** Abbreviated fielding position from roster entry (e.g. "RF", "2B", "DH"). */
  position?: string;
}
