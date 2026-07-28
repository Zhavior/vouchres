export interface HrPlayer {
  id: number;
  playerId: number;
  playerName: string;
  team: string;
  opponent: string;

  hrScore: number;
  confidence: number;

  probability?: number;

  bats?: string;
  throws?: string;

  salary?: number;

  tags: string[];

  isConfirmed: boolean;
  isProjected: boolean;
  isBlocked: boolean;
}
