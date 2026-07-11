import { useLiveAtBat } from './useLiveAtBat';
import type { LiveAtBatSnapshot } from '../../types/liveAtBat';

export interface LiveEdgeSignal {
  score: number;
  label: string;
  color: string;
  reasons: string[];
}

function calculateLiveEdge(
  snap: LiveAtBatSnapshot | undefined
): LiveEdgeSignal {

  if (!snap?.play) {
    return {
      score: 50,
      label: 'Waiting for at-bat',
      color: '#00F0FF',
      reasons: [
        'Live feed connected',
        'Awaiting pitch sequence'
      ],
    };
  }

  const pitches = snap.play.pitches ?? [];

  let score = 50;
  const reasons: string[] = [];

  const velocities = pitches
    .map((p) => p.velo)
    .filter((v): v is number => v !== null);

  if (velocities.length >= 2) {
    const latest = velocities[velocities.length - 1];
    const avg =
      velocities.reduce((a, b) => a + b, 0) /
      velocities.length;

    if (latest < avg - 1) {
      score += 10;
      reasons.push('Pitch velocity trending down');
    }
  }

  const strikes = pitches.filter(
    (p) => p.isStrike
  ).length;

  const balls = pitches.filter(
    (p) => p.isBall
  ).length;


  if (strikes >= 2) {
    score += 8;
    reasons.push('Pitcher ahead in count');
  }

  if (balls >= 2) {
    score -= 8;
    reasons.push('Hitter leverage improving');
  }


  score = Math.max(
    0,
    Math.min(
      100,
      score
    )
  );


  if (score >= 65) {
    return {
      score,
      label: 'Batter Advantage',
      color: '#00FF94',
      reasons,
    };
  }


  if (score <= 35) {
    return {
      score,
      label: 'Pitcher Advantage',
      color: '#fb7185',
      reasons,
    };
  }


  return {
    score,
    label: 'Neutral Battle',
    color: '#00F0FF',
    reasons,
  };
}


export function useVouchLiveEdge(gamePk: number) {

  const query = useLiveAtBat(gamePk);

  return {
    ...query,
    edge: calculateLiveEdge(query.data),
  };
}
