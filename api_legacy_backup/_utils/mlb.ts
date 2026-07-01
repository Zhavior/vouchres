const MLB_BASE = "https://statsapi.mlb.com/api/v1";

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function validDate(value: unknown): string {
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : todayISO();
  return date;
}

export async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "VouchEdge/Vercel API" },
    });
    if (!response.ok) throw new Error(`MLB API ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function getSchedule(date: string) {
  const url =
    `${MLB_BASE}/schedule?sportId=1&date=${date}` +
    "&hydrate=team,linescore,probablePitcher(note),venue,lineups";
  const data: any = await fetchJson(url);
  return data?.dates?.[0]?.games ?? [];
}

export function teamAbbr(team: any) {
  return team?.abbreviation ?? team?.teamCode ?? team?.fileCode ?? "";
}

export function normalizeGame(game: any, date: string) {
  const away = game?.teams?.away ?? {};
  const home = game?.teams?.home ?? {};
  const awayTeam = away.team ?? {};
  const homeTeam = home.team ?? {};
  const status = game?.status?.detailedState ?? game?.status?.abstractGameState ?? "Scheduled";

  return {
    id: String(game?.gamePk ?? ""),
    gamePk: game?.gamePk ?? null,
    gameId: String(game?.gamePk ?? ""),
    date,
    officialDate: game?.officialDate ?? date,
    gameDate: game?.gameDate ?? null,
    status,
    venue: game?.venue?.name ?? "TBD",
    awayTeam: {
      id: awayTeam.id ? String(awayTeam.id) : "",
      name: awayTeam.name ?? "Away",
      abbr: teamAbbr(awayTeam),
      score: away.score ?? 0,
      probablePitcher: away.probablePitcher
        ? {
            id: String(away.probablePitcher.id),
            name: away.probablePitcher.fullName,
            throws: away.probablePitcher.pitchHand?.code ?? null,
          }
        : null,
    },
    homeTeam: {
      id: homeTeam.id ? String(homeTeam.id) : "",
      name: homeTeam.name ?? "Home",
      abbr: teamAbbr(homeTeam),
      score: home.score ?? 0,
      probablePitcher: home.probablePitcher
        ? {
            id: String(home.probablePitcher.id),
            name: home.probablePitcher.fullName,
            throws: home.probablePitcher.pitchHand?.code ?? null,
          }
        : null,
    },
    linescore: game?.linescore ?? null,
  };
}

export function normalizePlayer(player: any, team: any, index: number) {
  return {
    playerId: player?.id ? String(player.id) : "",
    playerName: player?.fullName ?? "Unknown",
    name: player?.fullName ?? "Unknown",
    position: player?.primaryPosition?.abbreviation ?? null,
    battingOrder: index + 1,
    bats: player?.batSide?.code ?? null,
    throws: player?.pitchHand?.code ?? null,
    teamId: team.id ? String(team.id) : "",
    teamAbbr: team.abbr ?? "",
    headshotUrl: player?.id
      ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:best/v1/people/${player.id}/headshot/67/current`
      : null,
    isStarter: true,
  };
}
