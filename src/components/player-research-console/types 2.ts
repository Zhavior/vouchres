import type { MLBPlayer, Leg, Vouch } from '../../types';

export interface PlayerResearchConsoleProps {
  onAddLegToParlay: (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => void;
  onSaveVouch: (vouch: Vouch) => void;
  savedVouchIds: string[];
  activeLegs: Leg[];
  liveGames?: any[];
}

export interface AiReportEntry {
  score: number;
  report: string;
  status: string;
  groundingSources?: Array<{ title: string; url: string }>;
}

export type AiReportCache = Record<string, AiReportEntry>;

export type SplitTab = 'PLATOON' | 'VENUE' | 'RECENCY';
export type MetricsTab = 'BASE' | 'VISUAL';
export type DossierMode = 'POKEMON' | 'SABER';

export interface TeamColorSpec {
  gradient: string;
  border: string;
  text: string;
  glow: string;
  badge: string;
}
