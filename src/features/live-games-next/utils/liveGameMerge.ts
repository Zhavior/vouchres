import type { GameMatchup } from '../../../types/matchup';

function isLiveStatus(status: unknown): boolean {
  const value = String(status ?? '');
  return (
    /progress|live|in play|warmup|delayed/i.test(value) ||
    /\b(top|bottom|middle|end)\s+\d/.test(value) ||
    /\b\d+(st|nd|rd|th)\s+inning\b/.test(value)
  );
}

function isFinalStatus(status: unknown): boolean {
  return /final|game over|completed/i.test(String(status ?? ''));
}

function sortBySchedule(games: GameMatchup[]): GameMatchup[] {
  return [...games].sort((a, b) => {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;

    const timeDelta =
      Date.parse(a.gameTime || '') - Date.parse(b.gameTime || '');

    if (Number.isFinite(timeDelta) && timeDelta !== 0) {
      return timeDelta;
    }

    return String(a.gamePk).localeCompare(String(b.gamePk));
  });
}

/**
 * Merge enriched matchup data into the official MLB schedule.
 *
 * Official games establish the slate. Enrichment adds intelligence without
 * allowing stale state to incorrectly keep a final game live.
 */
export function mergeMatchups(
  base: GameMatchup[],
  enrichments: GameMatchup[],
): GameMatchup[] {
  const byGame = new Map<string, GameMatchup>();

  base.forEach((game) => {
    byGame.set(String(game.gamePk), game);
  });

  enrichments.forEach((rich) => {
    const key = String(rich.gamePk);
    const existing = byGame.get(key);

    if (!existing) {
      byGame.set(key, rich);
      return;
    }

    const isFinal =
      existing.isFinal ||
      rich.isFinal ||
      isFinalStatus(existing.status) ||
      isFinalStatus(rich.status);

    byGame.set(key, {
      ...rich,
      status: existing.status || rich.status,
      isLive:
        !isFinal &&
        (
          existing.isLive ||
          rich.isLive ||
          isLiveStatus(existing.status) ||
          isLiveStatus(rich.status)
        ),
      isFinal,
      score: existing.score ?? rich.score,
      gameTime: existing.gameTime || rich.gameTime,
      venue: rich.venue || existing.venue,
      away: {
        ...rich.away,
        logo: rich.away.logo || existing.away.logo,
      },
      home: {
        ...rich.home,
        logo: rich.home.logo || existing.home.logo,
      },
    });
  });

  return sortBySchedule(Array.from(byGame.values()));
}

/**
 * Apply official live-feed updates while preserving the caller's existing
 * schedule order so polling cannot reshuffle the visible slate.
 */
export function mergeOfficialLiveUpdates(
  enriched: GameMatchup[],
  official: GameMatchup[],
): GameMatchup[] {
  if (official.length === 0) return enriched;

  const officialByPk = new Map(
    official.map((game) => [String(game.gamePk), game]),
  );

  const seen = new Set<string>();

  const merged = enriched.map((game) => {
    const key = String(game.gamePk);
    seen.add(key);

    const next = officialByPk.get(key);
    if (!next) return game;

    const isFinal =
      next.isFinal ||
      isFinalStatus(next.status);

    return {
      ...game,
      status: next.status || game.status,
      isLive:
        !isFinal &&
        (
          next.isLive ||
          isLiveStatus(next.status)
        ),
      isFinal,
      score: next.score ?? game.score,
      gameTime: next.gameTime || game.gameTime,
    };
  });

  for (const game of official) {
    const key = String(game.gamePk);

    if (!seen.has(key)) {
      merged.push(game);
    }
  }

  return merged;
}
