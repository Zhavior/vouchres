import { getMlbHeadshotUrl } from '../../lib/mlbHeadshot';
import { logoByTeamId, logoByTeamName } from '../../lib/teamLogos';
import type { DailyMlbReport } from '../../types/mlb';
import type { HrWatchRow } from '../../features/hr/types/hrWatch';
import type { TodayDecision, TodayDecisionTone } from './todayDecisionModel';

export type TodayReelVisual =
  | {
      type: 'matchup';
      awayName: string;
      homeName: string;
      awayLogo: string | null;
      homeLogo: string | null;
      status: string;
    }
  | {
      type: 'portrait';
      name: string;
      headshotUrl: string | null;
      teamLogo: string | null;
      score: number;
      scoreLabel: string;
    }
  | {
      type: 'signal';
      label: string;
      value: number;
      awayLogo: string | null;
      homeLogo: string | null;
    };

export interface TodayReelSlide {
  id: 'decision' | 'hr-player' | 'run-environment' | 'pitcher';
  tone: TodayDecisionTone;
  kicker: string;
  title: string;
  description: string;
  evidence: string;
  risk: string;
  ctaLabel: string;
  ctaSection: string;
  visual: TodayReelVisual;
}

interface BuildTodayReelInput {
  decision: TodayDecision;
  report: DailyMlbReport | null;
  topPlayer: HrWatchRow | null;
}

const LIVE_STATUS = /live|in progress|manager challenge|delayed/i;
const FINAL_STATUS = /final|game over|completed/i;

function featuredGame(report: DailyMlbReport | null) {
  const games = report?.games ?? [];
  return games.find((game) => LIVE_STATUS.test(game.status))
    ?? games.find((game) => !FINAL_STATUS.test(game.status))
    ?? games[0]
    ?? null;
}

function matchupVisual(game: DailyMlbReport['games'][number] | null): TodayReelVisual {
  if (!game) {
    return {
      type: 'signal',
      label: 'Daily status',
      value: 0,
      awayLogo: null,
      homeLogo: null,
    };
  }

  return {
    type: 'matchup',
    awayName: game.awayTeam.abbreviation || game.awayTeam.name,
    homeName: game.homeTeam.abbreviation || game.homeTeam.name,
    awayLogo: logoByTeamId(game.awayTeam.teamId),
    homeLogo: logoByTeamId(game.homeTeam.teamId),
    status: game.status || 'Schedule available',
  };
}

export function buildTodayReelSlides({ decision, report, topPlayer }: BuildTodayReelInput): TodayReelSlide[] {
  const game = featuredGame(report);
  const decisionSlide: TodayReelSlide = {
    id: 'decision',
    tone: decision.tone,
    kicker: 'Your next move',
    title: decision.title,
    description: decision.description,
    evidence: decision.attention[0]?.detail ?? 'Decision based on currently available VouchEdge data.',
    risk: 'Research can change as lineups, games, and source availability change.',
    ctaLabel: decision.ctaLabel,
    ctaSection: decision.ctaSection,
    visual: matchupVisual(game),
  };
  const slides: TodayReelSlide[] = [];

  if (topPlayer) {
    const isOfficial = topPlayer.truthStatus === 'official';
    slides.push({
      id: 'hr-player',
      tone: isOfficial ? 'emerald' : 'cyan',
      kicker: isOfficial ? 'Official lineup HR signal' : 'Projected HR signal',
      title: topPlayer.playerName,
      description: `${topPlayer.team} vs ${topPlayer.opponent} · facing ${topPlayer.pitcherName || 'pitcher TBD'}`,
      evidence: topPlayer.reasons[0] || `HR research score ${Math.round(topPlayer.hrScore)}/100.`,
      risk: topPlayer.warnings[0] || (isOfficial
        ? 'A strong signal is still not a guaranteed outcome.'
        : 'Lineup status is projected and must be confirmed before action.'),
      ctaLabel: 'Research player',
      ctaSection: 'hr_board',
      visual: {
        type: 'portrait',
        name: topPlayer.playerName,
        headshotUrl: topPlayer.headshotUrl || getMlbHeadshotUrl(topPlayer.playerId, 426),
        teamLogo: topPlayer.teamLogoUrl || logoByTeamName(topPlayer.team),
        score: Math.round(topPlayer.hrScore),
        scoreLabel: 'HR score',
      },
    });
  }

  // Lead with a real player when one is available; this remains the fallback.
  slides.push(decisionSlide);

  const runEnvironment = report?.runEnvironments?.[0];
  if (runEnvironment) {
    const runGame = report?.games.find((candidate) => candidate.gamePk === runEnvironment.gamePk) ?? null;
    slides.push({
      id: 'run-environment',
      tone: runEnvironment.tier === 'SHOOTOUT' || runEnvironment.tier === 'HIGH' ? 'emerald' : 'cyan',
      kicker: 'Run environment to study',
      title: runEnvironment.matchup,
      description: `${runEnvironment.tier.toLowerCase()} scoring environment · ${Math.round(runEnvironment.runEnvironmentScore)}/100`,
      evidence: runEnvironment.reasons[0] || 'The daily report identified this matchup for additional scoring research.',
      risk: runEnvironment.warnings[0] || 'A favorable run environment does not guarantee any individual market result.',
      ctaLabel: 'Study this game',
      ctaSection: 'live_games',
      visual: {
        type: 'signal',
        label: 'Run environment',
        value: Math.round(runEnvironment.runEnvironmentScore),
        awayLogo: runGame ? logoByTeamId(runGame.awayTeam.teamId) : null,
        homeLogo: runGame ? logoByTeamId(runGame.homeTeam.teamId) : null,
      },
    });
  }

  const pitcher = report?.vulnerablePitchers?.[0];
  if (pitcher) {
    slides.push({
      id: 'pitcher',
      tone: pitcher.riskTier === 'EXTREME' || pitcher.riskTier === 'HIGH' ? 'amber' : 'cyan',
      kicker: 'Pitcher under pressure',
      title: pitcher.pitcherName,
      description: `${pitcher.team} vs ${pitcher.opponent} · throws ${pitcher.throws}`,
      evidence: pitcher.attackReasons[0] || `Pitcher vulnerability score ${Math.round(pitcher.vulnerabilityScore)}/100.`,
      risk: pitcher.whatCouldGoWrong[0] || 'Pitcher vulnerability is matchup context, not a guaranteed hitter outcome.',
      ctaLabel: 'Analyze pitcher',
      ctaSection: 'team_matchup_lab',
      visual: {
        type: 'signal',
        label: 'Pitcher vulnerability',
        value: Math.round(pitcher.vulnerabilityScore),
        awayLogo: logoByTeamName(pitcher.team),
        homeLogo: logoByTeamName(pitcher.opponent),
      },
    });
  }

  return slides;
}
