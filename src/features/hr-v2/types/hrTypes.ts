import { ChunkA } from '../api/contracts';

export interface MlbApiTeam {
  id: number;
  name: string;
  abbreviation: string;
}

export interface MlbApiPitcher {
  id: number;
  fullName: string;
  hand?: {
    code: 'L' | 'R';
    description: string;
  };
}

/**
 * Lineup player shape as returned by the MLB Stats API when hydrate=lineups is used.
 * Verified live against https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=lineups
 * on 2026-08-13. Array index within homePlayers/awayPlayers equals batting order slot (0-indexed).
 */
export interface MlbApiLineupPlayer {
  id: number;
  fullName: string;
  link?: string;
  firstName?: string;
  lastName?: string;
  useName?: string;
  primaryPosition?: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
}

export interface MlbApiGame {
  gamePk: number;
  gameDate: string;
  status: {
    abstractGameState: string;
    detailedState: string;
  };
  teams: {
    home: {
      team: MlbApiTeam;
      probablePitcher?: MlbApiPitcher;
    };
    away: {
      team: MlbApiTeam;
      probablePitcher?: MlbApiPitcher;
    };
  };
  /**
   * Lineup data populated when schedule is fetched with hydrate=lineups.
   * homePlayers and awayPlayers are ordered by batting slot (index 0 = leadoff).
   * May be absent or empty for games where lineups have not yet been posted.
   */
  lineups?: {
    homePlayers?: MlbApiLineupPlayer[];
    awayPlayers?: MlbApiLineupPlayer[];
  };
  venue?: {
    id: number;
    name: string;
  };
}

export interface MlbApiRosterPerson {
  id: number;
  fullName: string;
}

export interface MlbApiRosterEntry {
  person: MlbApiRosterPerson;
  jerseyNumber: string;
  position: { code: string; name: string; type: string; abbreviation: string };
  status: { code: string; description: string };
  parentTeamId: number;
}

export interface MlbApiRosterResponse {
  roster: MlbApiRosterEntry[];
}

export interface LiveSlatePayload {
  hitters: ChunkA[];
  totalBatters: number;
  timestamp: string;
  source: 'mlb_official_api' | 'cached_roster_deck';
}
