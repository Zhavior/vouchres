export type Candidate = {
  playerId?: number | string;
  playerName?: string;
  name?: string;
  headshotUrl?: string | null;
  headshot?: string | null;
  team?: string;
  opponent?: string;
  opponentTeam?: string;
  opponentPitcherName?: string;
  venue?: string;
  gamePk?: number | string;
  gameId?: number | string;
  hrScore?: number;
  riskTier?: string;
  confidenceTier?: string;
  estimatedHrProbability?: number;
  reasons?: string[];
  warnings?: string[];
  scoreBreakdown?: Record<string, number>;
};

export type IntelligenceReport = {
  date: string;
  gameCount: number;
  dataQuality: string;
  disclaimer: string;
  candidates: Candidate[];
};

export type AiJudgePick = {
  rank: number;
  judgeId?: string;
  playerId?: number | string | null;
  playerName: string;
  team: string;
  headshotUrl?: string | null;
  headshot?: string | null;
  opponent: string;
  opponentPitcherName?: string;
  venue?: string;
  pickType: string;
  market: string;
  specialtyLabel?: string;
  singlePickLabel?: string;
  judgeReason?: string;
  hrScore: number;
  agentScore: number;
  confidenceTier?: string | null;
  riskTier?: string | null;
  warnings?: string[];
  gradeable?: boolean;
  isAvoidPick?: boolean;
  availability?: {
    status: string;
    label: string;
    gradeable?: boolean;
    reasons: string[];
  };
};

export type AiJudge = {
  id: string;
  displayName: string;
  handle: string;
  tagline: string;
  persona: string;
  specialty?: string;
  color: string;
  trustScore: number;
  winRate: number | null;
  singlePickLimit?: number;
  record: {
    won: number;
    lost: number;
    pushed: number;
    graded: number;
    pending: number;
    netUnits: number;
  };
  topPick: AiJudgePick | null;
  topPicks: AiJudgePick[];
};

export type AiJudgeLeaderboard = {
  status: string;
  date: string;
  candidateCount: number;
  leaderboard: AiJudge[];
};

export type Tab =
  | 'overview'
  | 'targets'
  | 'pitchers'
  | 'games'
  | 'graphs'
  | 'judges'
  | 'agents';

export type Props = {
  profile?: any;
  onSectionChange?: (section: string) => void;
};
