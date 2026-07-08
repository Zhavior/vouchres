export type VaiPersonaId = 'banker' | 'analyst' | 'hunter' | 'shark';

export type VaiRiskProfile = 'conservative' | 'balanced' | 'momentum' | 'aggressive';

export type VaiMarketSpecialty =
  | 'HIT'
  | 'SINGLE'
  | 'DOUBLE'
  | 'TRIPLE'
  | 'ANYTIME_HR'
  | 'RBI'
  | 'RUN'
  | 'TOTAL_BASES'
  | 'STOLEN_BASE'
  | 'MIXED';

export interface VaiPersona {
  id: VaiPersonaId;
  name: string;
  shortName: string;
  roomName: string;
  riskProfile: VaiRiskProfile;
  accent: string;
  gradient: string;
  border: string;
  glow: string;
  lockIcon: string;
  toneLine: string;
  specialtyLine: string;
  lockedLine: string;
  preferredLegCounts: number[];
  specialties: VaiMarketSpecialty[];
  avoidMarkets?: VaiMarketSpecialty[];
  weights: {
    confidence: number;
    safety: number;
    ceiling: number;
    volatility: number;
    momentum: number;
    marketFit: number;
  };
}

export const VAI_PERSONAS: VaiPersona[] = [
  {
    id: 'banker',
    name: 'The Banker',
    shortName: 'Banker',
    roomName: 'Banker Room',
    riskProfile: 'conservative',
    accent: 'Emerald / Gold',
    gradient: 'from-emerald-500/20 via-slate-950 to-yellow-500/10',
    border: 'border-emerald-400/30',
    glow: 'shadow-emerald-950/40',
    lockIcon: 'vault',
    toneLine: 'I do not chase fireworks. I protect the slip.',
    specialtyLine: 'Contact floor, RBI, runs, and low-volatility slips.',
    lockedLine: 'Upgrade to unlock disciplined Banker slips.',
    preferredLegCounts: [2, 3],
    specialties: ['HIT', 'SINGLE', 'RBI', 'RUN'],
    avoidMarkets: ['ANYTIME_HR', 'TRIPLE', 'STOLEN_BASE'],
    weights: {
      confidence: 1.35,
      safety: 1.45,
      ceiling: 0.55,
      volatility: -0.85,
      momentum: 0.75,
      marketFit: 1.2,
    },
  },
  {
    id: 'analyst',
    name: 'The Analyst',
    shortName: 'Analyst',
    roomName: 'Analyst Room',
    riskProfile: 'balanced',
    accent: 'Blue / Cyan',
    gradient: 'from-cyan-500/20 via-slate-950 to-blue-500/10',
    border: 'border-cyan-400/30',
    glow: 'shadow-cyan-950/40',
    lockIcon: 'scanner',
    toneLine: 'The data agrees enough to build.',
    specialtyLine: 'Balanced model agreement, market fit, and clean risk/reward.',
    lockedLine: 'Upgrade to unlock the Analyst model room.',
    preferredLegCounts: [2, 3, 4, 5],
    specialties: ['HIT', 'SINGLE', 'DOUBLE', 'RBI', 'RUN', 'TOTAL_BASES', 'MIXED'],
    weights: {
      confidence: 1.2,
      safety: 1.0,
      ceiling: 0.9,
      volatility: -0.35,
      momentum: 1.0,
      marketFit: 1.15,
    },
  },
  {
    id: 'hunter',
    name: 'The Hunter',
    shortName: 'Hunter',
    roomName: 'Hunter Room',
    riskProfile: 'momentum',
    accent: 'Amber / Orange',
    gradient: 'from-amber-500/20 via-slate-950 to-orange-500/10',
    border: 'border-amber-400/30',
    glow: 'shadow-amber-950/40',
    lockIcon: 'target',
    toneLine: 'I track movement before the market reacts.',
    specialtyLine: 'Momentum, run traffic, RBI pressure, and game-flow slips.',
    lockedLine: 'Upgrade to unlock Hunter movement slips.',
    preferredLegCounts: [2, 3, 4],
    specialties: ['DOUBLE', 'RBI', 'RUN', 'TOTAL_BASES', 'MIXED'],
    weights: {
      confidence: 1.0,
      safety: 0.75,
      ceiling: 1.05,
      volatility: -0.1,
      momentum: 1.45,
      marketFit: 1.15,
    },
  },
  {
    id: 'shark',
    name: 'The Shark',
    shortName: 'Shark',
    roomName: 'Shark Room',
    riskProfile: 'aggressive',
    accent: 'Violet / Red',
    gradient: 'from-violet-500/20 via-slate-950 to-red-500/10',
    border: 'border-violet-400/30',
    glow: 'shadow-violet-950/40',
    lockIcon: 'shark',
    toneLine: 'I do not play safe. I hunt ceiling.',
    specialtyLine: 'Stolen bases, HRs, triples, doubles, and 4+ total-base chaos.',
    lockedLine: 'Upgrade to unlock Shark ceiling attacks.',
    preferredLegCounts: [3, 4, 5],
    specialties: ['ANYTIME_HR', 'STOLEN_BASE', 'TRIPLE', 'TOTAL_BASES', 'DOUBLE', 'MIXED'],
    weights: {
      confidence: 0.85,
      safety: 0.35,
      ceiling: 1.55,
      volatility: 0.65,
      momentum: 1.2,
      marketFit: 1.35,
    },
  },
];

export function getVaiPersona(id: VaiPersonaId): VaiPersona {
  const persona = VAI_PERSONAS.find((item) => item.id === id);
  if (!persona) throw new Error(`Unknown V.A.I persona: ${id}`);
  return persona;
}
