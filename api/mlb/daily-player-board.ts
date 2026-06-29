export default async function handler(req: any, res: any) {
  try {
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

      const awayPitcher = awayPitcherRaw
        ? {
            id: awayPitcherRaw.id,
            name: awayPitcherRaw.fullName || awayPitcherRaw.name || 'TBD',
            throws: awayPitcherRaw?.pitchHand?.code || '',
          }
        : null;

      const homePitcher = homePitcherRaw
        ? {
            id: homePitcherRaw.id,
            name: homePitcherRaw.fullName || homePitcherRaw.name || 'TBD',
            throws: homePitcherRaw?.pitchHand?.code || '',
          }
        : null;

      return {
        gamePk: game?.gamePk,
        awayTeam,
        homeTeam,
        gameTime: game?.gameDate || '',
        venue: game?.venue?.name || '',
        status: game?.status?.detailedState || game?.status?.abstractGameState || 'Scheduled',
        awayPitcher,
        homePitcher,
        lineupConfirmed: false,
        dataQuality: awayPitcher || homePitcher ? 'pitchers' : 'game_shell',
        awayLineup: [],
        homeLineup: [],
        players: [],
        totalPlayers: 0,
      };
    });

    res.status(200).json({
      ok: true,
      date,
      totalGames: games.length,
      totalPlayers: 0,
      games,
      source: 'vercel_function_mlb_schedule_probable_pitchers',
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err?.message || 'Daily Player Board failed',
      date: new Date().toISOString().slice(0, 10),
      totalGames: 0,
      totalPlayers: 0,
      games: [],
      source: 'vercel_function_error',
    });
  }
}
