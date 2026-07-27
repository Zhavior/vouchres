/** Canonical AI judges — mirrors server/services/aiJudges/aiJudgeLeaderboardService.ts */
export const LANDING_JUDGES = [
  {
    id: 'data_scout',
    code: 'DS',
    displayName: 'Data Scout',
    handle: 'ai-data-scout',
    tagline: 'Clean math. Low hype. Safer profiles.',
    persona: 'Finds cleaner HR profiles with better data quality and fewer red flags.',
    specialty: 'Math-first slate screening',
    useCase: 'Screen the full slate before first pitch — rank data quality, score logic, and weak spots without hype.',
    quote: 'I only surface hitters when the math is clean and the board agrees.',
    authTip: 'Sign in to unlock my math-first slate screen — every pick graded against real box scores.',
    color: 'cyan',
  },
  {
    id: 'power_hunter',
    code: 'PH',
    displayName: 'Power Hunter',
    handle: 'ai-power-hunter',
    tagline: 'Home-run upside hunter.',
    persona: 'Chases raw HR upside using hitter power, pitcher vulnerability, and park context.',
    specialty: 'HR threat radar',
    useCase: 'Hunt raw home-run upside — power paths, pitcher mistake zones, and park leverage on game day.',
    quote: 'When the barrel meets a mistake pitch, I want you there first.',
    authTip: 'Your account saves HR threat reads — power paths, park context, and pitcher zones in one place.',
    color: 'orange',
  },
  {
    id: 'momentum_reader',
    code: 'MR',
    displayName: 'Momentum Reader',
    handle: 'ai-momentum-reader',
    tagline: 'Recent form and rhythm reader.',
    persona: 'Reads recent form, lineup volume, and short-term momentum signals.',
    specialty: 'Game rhythm & form',
    useCase: 'Read who is hot right now — recent form, lineup volume, and late-game pressure windows.',
    quote: 'Form is fleeting, but rhythm tells you who is swinging with intent.',
    authTip: 'Track who is hot right now — form signals update live once you are signed in.',
    color: 'purple',
  },
  {
    id: 'risk_auditor',
    code: 'RA',
    displayName: 'Risk Auditor',
    handle: 'ai-risk-auditor',
    tagline: 'Finds traps before they cost you.',
    persona: 'Flags thin data, risky profiles, projection problems, and low-confidence picks.',
    specialty: 'Skeptical filter',
    useCase: 'Audit every pick for traps — projected lineups, missing data, and fake confidence before you stake.',
    quote: 'If the board cannot verify it, I will not let it through.',
    authTip: 'I flag traps before they reach your slip — projected lineups and thin data stay blocked.',
    color: 'amber',
  },
] as const;

export type LandingJudge = (typeof LANDING_JUDGES)[number];

export const JUDGE_PIXEL_THEME: Record<string, { main: string; glow: string; accent: string; active: number[] }> = {
  DS: { main: 'bg-sky-300', glow: 'bg-sky-500/25', accent: 'bg-cyan-300/80', active: [1, 2, 5, 6, 9, 10, 13, 14] },
  PH: { main: 'bg-red-300', glow: 'bg-red-500/25', accent: 'bg-orange-300/80', active: [0, 3, 5, 6, 9, 10, 12, 15] },
  MR: { main: 'bg-violet-300', glow: 'bg-violet-500/25', accent: 'bg-fuchsia-300/80', active: [1, 4, 6, 9, 11, 13, 14] },
  RA: { main: 'bg-amber-300', glow: 'bg-amber-500/25', accent: 'bg-yellow-200/80', active: [0, 1, 2, 4, 8, 12, 13, 14] },
};

export const JUDGE_COLOR_RING: Record<string, string> = {
  cyan: 'border-vouch-cyan/30 shadow-[0_0_32px_rgba(0,240,255,0.12)]',
  orange: 'border-orange-400/30 shadow-[0_0_32px_rgba(251,146,60,0.1)]',
  purple: 'border-violet-400/30 shadow-[0_0_32px_rgba(167,139,250,0.1)]',
  amber: 'border-amber-400/30 shadow-[0_0_32px_rgba(251,191,36,0.1)]',
};
