/** Result + learning-note shapes. */

export type ResultStatus = "pending" | "win" | "loss" | "push";

export interface LearningNote {
  pickId: string;
  result: ResultStatus;
  originalLogic: string;
  whatActuallyHappened: string;
  whyWon: string | null;
  whyLost: string | null;
  dataWasCorrect: boolean;
  dataWasMisleading: boolean;
  futureAdjustment: string;
  note?: string; // AI-written narrative
}

export interface PickRecord {
  pickId: string;
  capperId: string;
  userId?: string;
  player?: string;
  team: string;
  opponent?: string;
  market: string;
  selection: string;
  score: number;
  riskLabel?: string;
  reasons?: string[];
  createdAt: string;
  gameDate: string;
  status: ResultStatus;
  gradedAt?: string;
  learningNote?: LearningNote;
}
