export type PickSelection = "over" | "under" | "yes" | "no";

export interface PickInput {
  sport: string;
  league: string;

  eventId: string;
  gameDate: string;

  playerId: string;
  playerName: string;

  team: string;
  opponent: string;

  market: string;
  selection: PickSelection;

  line: number | null;
  odds: number | null;

  sportsbook: string | null;

  source: "hr-board" | "research" | "parlay" | "manual";
}
