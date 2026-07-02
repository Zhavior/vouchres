export type AiCreatorSport = 'MLB';

export type AiCreatorMarketCode =
  | 'ANYTIME_HR'
  | 'HIT'
  | 'TOTAL_BASES'
  | 'RBI'
  | 'RUN'
  | 'STRIKEOUTS';

export type AiCreatorComparator = '>=' | '<=' | '=';

export type AiCreatorCandidate = {
  sport: AiCreatorSport;
  gameId: string;
  gamePk?: string;
  playerId: string;
  teamId?: string;
  playerName: string;
  teamName?: string;
  marketCode: AiCreatorMarketCode;
  statTarget: number;
  comparator: AiCreatorComparator;
  odds?: string | number;
  gameStartTime?: string;
  externalProvider: 'mlb_statsapi' | 'manual' | 'unknown';
  reason?: string;
};

export type AiCreatorIdentity = {
  sport: AiCreatorSport;
  gameId: string;
  gamePk: string;
  playerId: string;
  teamId: string;
  marketCode: AiCreatorMarketCode;
  statTarget: number;
  comparator: AiCreatorComparator;
  eventKey: string;
  popularityKey: string;
  externalProvider: 'mlb_statsapi' | 'manual' | 'unknown';
};

export type AiCreatorRejectedCandidate = {
  candidate: Partial<AiCreatorCandidate>;
  reason: string;
};

export type AiCreatorIdentityResult =
  | {
      ok: true;
      candidate: AiCreatorCandidate;
      identity: AiCreatorIdentity;
    }
  | {
      ok: false;
      rejected: AiCreatorRejectedCandidate;
    };
