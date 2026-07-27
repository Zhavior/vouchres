/**
 * statHubConfig — Registry mapping statType → full config
 *
 * Adding stat #9: register here only, no component branching needed.
 * Judge 1: per-stat tier labels
 * Judge 4: config registry pattern
 */

import type { StatConfig, StatType } from '../types/statHubTypes';

const DEFAULT_THRESHOLDS = { elite: 90, strong: 78, watch: 65, sleeper: 50 };

export const STAT_CONFIG: Record<StatType, StatConfig> = {
  hr: {
    statType: 'hr',
    label: 'Home Runs',
    shortLabel: 'HR',
    icon: '💣',
    description: 'HR probability model — 12-layer power & matchup scoring',
    token: 've-accent-gold',
    tierLabels: { elite: 'ELITE', strong: 'STRONG', watch: 'WATCH', sleeper: 'SLEEPER', fade: 'FADE' },
    thresholds: { elite: 92, strong: 85, watch: 75, sleeper: 62 },
    primaryDriver: 'Hitter Power',
    phase: 1,
    drawerFields: ['hitterPower','pitcherVulnerability','parkFactor','recentForm','vegasEdge'],
    spreadsheetCols: [
      { key: 'playerName', label: 'Player', width: 160 },
      { key: 'team', label: 'Team', width: 60 },
      { key: 'opponent', label: 'Opp', width: 60 },
      { key: 'pitcherName', label: 'Pitcher', width: 120 },
      { key: 'lineupSpot', label: 'Spot', width: 50 },
      { key: 'statScore', label: 'Score', width: 70 },
      { key: 'seasonValue', label: 'HR', width: 60 },
      { key: 'edgePct', label: 'Edge', width: 70 },
      { key: 'bookOdds', label: 'Odds', width: 70 },
    ],
  },

  rbi: {
    statType: 'rbi',
    label: 'RBI',
    shortLabel: 'RBI',
    icon: '🏠',
    description: 'RBI opportunity model — lineup, run projection, situational hitting',
    token: 've-accent-cyan',
    tierLabels: { elite: 'PRIME', strong: 'SOLID', watch: 'WATCH', sleeper: 'SLEEPER', fade: 'FADE' },
    thresholds: DEFAULT_THRESHOLDS,
    primaryDriver: 'Lineup Position',
    phase: 1,
    drawerFields: ['lineupSpot','teamRunProjection','runnersOnBase','pitcherWeakness','contactRate'],
    spreadsheetCols: [
      { key: 'playerName', label: 'Player', width: 160 },
      { key: 'team', label: 'Team', width: 60 },
      { key: 'opponent', label: 'Opp', width: 60 },
      { key: 'lineupSpot', label: 'Spot', width: 50 },
      { key: 'statScore', label: 'Score', width: 70 },
      { key: 'seasonValue', label: 'RBI', width: 60 },
      { key: 'edgePct', label: 'Edge', width: 70 },
      { key: 'bookLine', label: 'Line', width: 70 },
    ],
  },

  runs: {
    statType: 'runs',
    label: 'Runs',
    shortLabel: 'R',
    icon: '🏃',
    description: 'Runs scored model — on-base, lineup spot, team offense, speed',
    token: 've-success',
    tierLabels: { elite: 'PRIME', strong: 'SOLID', watch: 'WATCH', sleeper: 'SLEEPER', fade: 'FADE' },
    thresholds: DEFAULT_THRESHOLDS,
    primaryDriver: 'On-Base Ability',
    phase: 1,
    drawerFields: ['obpTrend','lineupSpot','teamOffenseScore','pitcherWeakness','speedScore'],
    spreadsheetCols: [
      { key: 'playerName', label: 'Player', width: 160 },
      { key: 'team', label: 'Team', width: 60 },
      { key: 'opponent', label: 'Opp', width: 60 },
      { key: 'lineupSpot', label: 'Spot', width: 50 },
      { key: 'statScore', label: 'Score', width: 70 },
      { key: 'seasonValue', label: 'R', width: 60 },
      { key: 'edgePct', label: 'Edge', width: 70 },
      { key: 'bookLine', label: 'Line', width: 70 },
    ],
  },

  sb: {
    statType: 'sb',
    label: 'Stolen Bases',
    shortLabel: 'SB',
    icon: '⚡',
    description: 'SB model — sprint speed, defensive response time, game script',
    token: 've-accent-pink',
    tierLabels: { elite: 'GO', strong: 'RUNNING', watch: 'WATCH', sleeper: 'POSSIBLE', fade: 'UNLIKELY' },
    thresholds: DEFAULT_THRESHOLDS,
    primaryDriver: 'Sprint Speed',
    phase: 1,
    drawerFields: ['sprintSpeed','stealRate','defResponseTime','teamAggression','gameScript'],
    spreadsheetCols: [
      { key: 'playerName', label: 'Player', width: 160 },
      { key: 'team', label: 'Team', width: 60 },
      { key: 'opponent', label: 'Opp', width: 60 },
      { key: 'lineupSpot', label: 'Spot', width: 50 },
      { key: 'statScore', label: 'Score', width: 70 },
      { key: 'seasonValue', label: 'SB', width: 60 },
      { key: 'edgePct', label: 'Edge', width: 70 },
      { key: 'bookOdds', label: 'Odds', width: 70 },
    ],
  },

  hits: {
    statType: 'hits',
    label: 'Hits',
    shortLabel: 'H',
    icon: '🎯',
    description: 'Hit probability — contact rate, BABIP tendency, opposing pitcher',
    token: 've-accent-cyan',
    tierLabels: { elite: 'LOCKED', strong: 'STRONG', watch: 'LEAN', sleeper: 'TARGET', fade: 'PASS' },
    thresholds: DEFAULT_THRESHOLDS,
    primaryDriver: 'Contact Rate',
    phase: 2,
    drawerFields: ['contactRate','babipTrend','pitcherHardContactAllowed'],
    spreadsheetCols: [
      { key: 'playerName', label: 'Player', width: 160 },
      { key: 'team', label: 'Team', width: 60 },
      { key: 'statScore', label: 'Score', width: 70 },
      { key: 'seasonValue', label: 'H', width: 60 },
      { key: 'edgePct', label: 'Edge', width: 70 },
    ],
  },

  total_bases: {
    statType: 'total_bases',
    label: 'Total Bases',
    shortLabel: 'TB',
    icon: '🔋',
    description: 'Total bases — ISO/slugging, extra-base park factor',
    token: 've-accent-gold',
    tierLabels: { elite: 'LOCKED', strong: 'STRONG', watch: 'LEAN', sleeper: 'TARGET', fade: 'PASS' },
    thresholds: DEFAULT_THRESHOLDS,
    primaryDriver: 'ISO / Slug',
    phase: 2,
    drawerFields: ['iso','slugPct','parkExtraBaseFactor'],
    spreadsheetCols: [
      { key: 'playerName', label: 'Player', width: 160 },
      { key: 'team', label: 'Team', width: 60 },
      { key: 'statScore', label: 'Score', width: 70 },
      { key: 'seasonValue', label: 'TB', width: 60 },
      { key: 'edgePct', label: 'Edge', width: 70 },
    ],
  },

  doubles: {
    statType: 'doubles',
    label: 'Doubles',
    shortLabel: '2B',
    icon: '✌️',
    description: 'Double probability — gap power, park depth, OF defense',
    token: 've-accent-pink',
    tierLabels: { elite: 'LOCKED', strong: 'STRONG', watch: 'LEAN', sleeper: 'TARGET', fade: 'PASS' },
    thresholds: DEFAULT_THRESHOLDS,
    primaryDriver: 'Gap Power',
    phase: 2,
    drawerFields: ['gapPower','parkGapFactor','ofArmStrength'],
    spreadsheetCols: [
      { key: 'playerName', label: 'Player', width: 160 },
      { key: 'team', label: 'Team', width: 60 },
      { key: 'statScore', label: 'Score', width: 70 },
      { key: 'seasonValue', label: '2B', width: 60 },
      { key: 'edgePct', label: 'Edge', width: 70 },
    ],
  },

  pitcher_k: {
    statType: 'pitcher_k',
    label: 'Pitcher Strikeouts',
    shortLabel: 'K',
    icon: '🔥',
    description: 'K model — pitcher trailing K avg, opposing lineup K%, swinging strike rate',
    token: 've-danger',
    tierLabels: { elite: 'ACE', strong: 'SOLID', watch: 'LEAN', sleeper: 'LONGSHOT', fade: 'PASS' },
    thresholds: DEFAULT_THRESHOLDS,
    primaryDriver: 'Trailing K Avg',
    phase: 2,
    drawerFields: ['trailingKAvg','opposingLineupKPct','swingingStrikeRate','pitchMix'],
    spreadsheetCols: [
      { key: 'playerName', label: 'Pitcher', width: 160 },
      { key: 'team', label: 'Team', width: 60 },
      { key: 'opponent', label: 'Opp', width: 60 },
      { key: 'statScore', label: 'Score', width: 70 },
      { key: 'seasonValue', label: 'K', width: 60 },
      { key: 'edgePct', label: 'Edge', width: 70 },
      { key: 'bookLine', label: 'Line', width: 70 },
    ],
  },
};

export const STAT_ORDER: StatType[] = ['hr', 'rbi', 'runs', 'sb', 'hits', 'total_bases', 'doubles', 'pitcher_k'];

export function getStatConfig(statType: StatType): StatConfig {
  return STAT_CONFIG[statType];
}
