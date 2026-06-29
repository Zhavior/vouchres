export default async function handler(req: any, res: any) {
  try {
    const route = Array.isArray(req.query.route)
      ? req.query.route.join('/')
      : String(req.query.route || '');

    const supportedRoutes = new Set([
      'mlb/daily-player-board',
      'mlb/lineup/today',
      'daily-players',
    ]);

    if (!supportedRoutes.has(route)) {
      return res.status(404).json({
        ok: false,
        error: `Unknown API route: /api/${route}`,
      });
    }

    const date = String(req.query.date || new Date().toISOString().slice(0, 10));

    const scheduleUrl =
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=probablePitcher,team,venue`;

    const scheduleResponse = await fetch(scheduleUrl, {
      headers: {
        accept: 'application/json',
        'user-agent': 'VouchEdge-DailyPlayerBoard/1.0',
      },
    });

    if (!scheduleResponse.ok) {
      throw new Error(`MLB schedule failed: ${scheduleResponse.status}`);
    }

    const schedule = await scheduleResponse.json();
    const rawGames = schedule?.dates?.flatMap((d: any) => d?.games || []) || [];

    const games = rawGames.map((game: any) => {
      const awayTeam = game?.teams?.away?.team?.name || 'Away';
      const homeTeam = game?.teams?.home?.team?.name || 'Home';
      const awayPitcherRaw = game?.teams?.away?.probablePitcher;
      const homePitcherRaw = game?.teams?.home?.probablePitcher;

      return {
        gamePk: game?.gamePk,
        awayTeam,
        homeTeam,
        gameTime: game?.gameDate || '',
        venue: game?.venue?.name || '',
        status: game?.status?.detailedState || game?.status?.abstractGameState || 'Scheduled',
        awayPitcher: awayPitcherRaw
          ? {
              id: awayPitcherRaw.id,
              name: awayPitcherRaw.fullName || awayPitcherRaw.name || 'TBD',
              throws: awayPitcherRaw?.pitchHand?.code || '',
            }
          : null,
        homePitcher: homePitcherRaw
          ? {
              id: homePitcherRaw.id,
              name: homePitcherRaw.fullName || homePitcherRaw.name || 'TBD',
              throws: homePitcherRaw?.pitchHand?.code || '',
            }
          : null,
        lineupConfirmed: false,
        dataQuality: awayPitcherRaw || homePitcherRaw ? 'pitchers' : 'game_shell',
        awayLineup: [],
        homeLineup: [],
        players: [],
        totalPlayers: 0,
      };
    });

    return res.status(200).json({
      ok: true,
      date,
      totalGames: games.length,
      totalPlayers: 0,
      games,
      source: 'single_vercel_api_function_daily_player_board',
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Daily Player Board failed',
      date: new Date().toISOString().slice(0, 10),
      totalGames: 0,
      totalPlayers: 0,
      games: [],
      source: 'single_vercel_api_function_error',
    });
  }
}
