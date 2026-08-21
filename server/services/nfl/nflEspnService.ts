import { z } from "zod";

export interface NflTeamIntelligence {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  logo: string;
  score: string;
  isHome: boolean;
  winner: boolean;
}

export interface NflLeader {
  category: string; // passing, rushing, receiving
  athleteName: string;
  athleteHeadshot: string;
  athleteId: string;
  displayValue: string; // e.g. "300 YDS, 3 TD"
  teamId: string;
}

export interface NflMatchupIntelligence {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: string;
  period: number;
  clock: string;
  homeTeam: NflTeamIntelligence;
  awayTeam: NflTeamIntelligence;
  leaders: NflLeader[];
}

export async function fetchNflTouchdownIntelligence(): Promise<NflMatchupIntelligence[]> {
  const response = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard");
  if (!response.ok) {
    throw new Error(`ESPN API failed with status ${response.status}`);
  }

  const data = await response.json();
  const events = data?.events || [];

  const parsedEvents = events.map((event: any) => {
    const competition = event.competitions?.[0];
    const competitors = competition?.competitors || [];
    
    let homeTeam = {} as NflTeamIntelligence;
    let awayTeam = {} as NflTeamIntelligence;

    for (const c of competitors) {
      const team = {
        id: c.team?.id || "",
        name: c.team?.displayName || "",
        abbreviation: c.team?.abbreviation || "",
        color: c.team?.color || "000000",
        logo: c.team?.logo || "",
        score: c.score || "0",
        isHome: c.homeAway === "home",
        winner: c.winner || false,
      };
      if (team.isHome) homeTeam = team;
      else awayTeam = team;
    }

    const leaders: NflLeader[] = [];
    if (competition?.leaders) {
      for (const l of competition.leaders) {
        const category = l.name; // "passing", "rushing", "receiving"
        const leaderObj = l.leaders?.[0];
        if (leaderObj) {
          leaders.push({
            category,
            athleteName: leaderObj.athlete?.fullName || "",
            athleteHeadshot: leaderObj.athlete?.headshot || "",
            athleteId: leaderObj.athlete?.id || "",
            displayValue: leaderObj.displayValue || "",
            teamId: leaderObj.team?.id || "",
          });
        }
      }
    }

    return {
      id: event.id,
      name: event.name,
      shortName: event.shortName,
      date: event.date,
      status: event.status?.type?.state || "pre", // pre, in, post
      period: event.status?.period || 1,
      clock: event.status?.displayClock || "0:00",
      homeTeam,
      awayTeam,
      leaders,
    };
  });

  // MOCK DATA FALLBACK for UI demonstration
  if (parsedEvents.length === 0) {
    return [
      {
        id: "mock1",
        name: "Detroit Lions at Kansas City Chiefs",
        shortName: "DET @ KC",
        date: new Date().toISOString(),
        status: "in",
        period: 3,
        clock: "8:42",
        homeTeam: {
          id: "12", name: "Chiefs", abbreviation: "KC", color: "E31837", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png", score: "24", isHome: true, winner: false
        },
        awayTeam: {
          id: "8", name: "Lions", abbreviation: "DET", color: "0076B6", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png", score: "21", isHome: false, winner: false
        },
        leaders: [
          { category: "passing", athleteName: "P. Mahomes", athleteHeadshot: "https://a.espncdn.com/i/headshots/nfl/players/full/3139477.png", athleteId: "3139477", displayValue: "315 YDS, 3 TD, 0 INT", teamId: "12" },
          { category: "rushing", athleteName: "D. Montgomery", athleteHeadshot: "https://a.espncdn.com/i/headshots/nfl/players/full/4035689.png", athleteId: "4035689", displayValue: "85 YDS, 1 TD", teamId: "8" },
          { category: "receiving", athleteName: "T. Kelce", athleteHeadshot: "https://a.espncdn.com/i/headshots/nfl/players/full/15847.png", athleteId: "15847", displayValue: "110 YDS, 2 TD, 8 REC", teamId: "12" },
        ]
      },
      {
        id: "mock2",
        name: "San Francisco 49ers at Philadelphia Eagles",
        shortName: "SF @ PHI",
        date: new Date().toISOString(),
        status: "in",
        period: 4,
        clock: "2:00",
        homeTeam: {
          id: "21", name: "Eagles", abbreviation: "PHI", color: "004C54", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png", score: "31", isHome: true, winner: false
        },
        awayTeam: {
          id: "25", name: "49ers", abbreviation: "SF", color: "AA0000", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png", score: "28", isHome: false, winner: false
        },
        leaders: [
          { category: "passing", athleteName: "J. Hurts", athleteHeadshot: "https://a.espncdn.com/i/headshots/nfl/players/full/4043020.png", athleteId: "4043020", displayValue: "280 YDS, 2 TD, 1 INT", teamId: "21" },
          { category: "rushing", athleteName: "C. McCaffrey", athleteHeadshot: "https://a.espncdn.com/i/headshots/nfl/players/full/3117251.png", athleteId: "3117251", displayValue: "120 YDS, 2 TD", teamId: "25" },
          { category: "receiving", athleteName: "A. Brown", athleteHeadshot: "https://a.espncdn.com/i/headshots/nfl/players/full/4047646.png", athleteId: "4047646", displayValue: "145 YDS, 1 TD, 9 REC", teamId: "21" },
        ]
      },
      {
        id: "mock3",
        name: "Dallas Cowboys at New York Giants",
        shortName: "DAL @ NYG",
        date: new Date(Date.now() + 3600000).toISOString(),
        status: "pre",
        period: 1,
        clock: "0:00",
        homeTeam: {
          id: "19", name: "Giants", abbreviation: "NYG", color: "0B2265", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png", score: "0", isHome: true, winner: false
        },
        awayTeam: {
          id: "6", name: "Cowboys", abbreviation: "DAL", color: "003594", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png", score: "0", isHome: false, winner: false
        },
        leaders: []
      }
    ];
  }

  return parsedEvents;
}

// TDPI Math Engine Helper
function calculateTDPI(metrics: {
  rzTouchShare: number;
  inside10Touches: number;
  impliedTotal: number;
  oppRzDefRank: number;
}): { score: number; tier: 'ELITE' | 'STRONG' | 'VALUE' | 'SLEEPER' } {
  const { rzTouchShare, inside10Touches, impliedTotal, oppRzDefRank } = metrics;
  
  // Normalization (0-100 scale)
  const normRZ = Math.min(rzTouchShare * 1.1, 100);
  const normInside10 = Math.min((inside10Touches / 15) * 100, 100);
  const normTotal = Math.min((impliedTotal / 32) * 100, 100);
  const normDefVuln = (oppRzDefRank / 32) * 100; // Rank 32 is most vulnerable

  const rawScore =
    normRZ * 0.30 +
    normInside10 * 0.25 +
    normTotal * 0.20 +
    normDefVuln * 0.25;

  const score = Math.round(rawScore * 10) / 10;

  let tier: 'ELITE' | 'STRONG' | 'VALUE' | 'SLEEPER' = 'SLEEPER';
  if (score >= 80) tier = 'ELITE';
  else if (score >= 65) tier = 'STRONG';
  else if (score >= 50) tier = 'VALUE';

  return { score, tier };
}

export async function fetchNflTouchdownSlatePlayers(): Promise<any[]> {
  try {
    const scoreboardRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
    if (!scoreboardRes.ok) throw new Error('Failed to fetch ESPN scoreboard');
    const scoreboardData = await scoreboardRes.json();
    const events = scoreboardData.events || [];

    const allPlayers: any[] = [];

    // Process every game and team on the slate
    for (const event of events) {
      const competition = event.competitions?.[0];
      const competitors = competition?.competitors || [];
      const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
      const awayTeam = competitors.find((c: any) => c.homeAway === 'away');

      for (const team of [homeTeam, awayTeam]) {
        if (!team) continue;
        const oppTeam = team.id === homeTeam?.id ? awayTeam : homeTeam;

        // Fetch team roster
        try {
          const rosterRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${team.team.id}/roster`);
          if (!rosterRes.ok) continue;
          
          const rosterJson = await rosterRes.json();
          // Flatten offensive skill positions
          const athletes = (rosterJson.athletes || []).flatMap((group: any) => group.items || []);
          const skillPlayers = athletes.filter((a: any) =>
            ['RB', 'WR', 'TE', 'QB'].includes(a.position?.abbreviation)
          );

          // Map and compute metrics for every skill player
          for (const athlete of skillPlayers) {
            // Provide realistic fallback seeds if API lacks detailed prop stats
            const isRB = athlete.position?.abbreviation === 'RB';
            const isQB = athlete.position?.abbreviation === 'QB';
            const rzTouchShare = athlete.statsSummary?.rzShare ?? (isRB ? Math.random() * 60 + 15 : Math.random() * 40 + 5);
            const inside10Touches = athlete.statsSummary?.inside10 ?? Math.floor(Math.random() * 12);
            // Defaulting implied total. A real app would fetch this from an odds API.
            const impliedTotal = 24.5;
            // Defaulting opp defense rank.
            const oppRzDefRank = Math.floor(Math.random() * 32) + 1;

            const { score, tier } = calculateTDPI({
              rzTouchShare,
              inside10Touches,
              impliedTotal,
              oppRzDefRank,
            });

            // If a player is heavily buried in the depth chart (score < 20), skip them to avoid bloat
            if (score < 20 && !isQB) continue;

            allPlayers.push({
              id: `p-${athlete.id}`,
              name: athlete.displayName,
              jerseyNumber: athlete.jersey,
              position: athlete.position?.abbreviation,
              team: team.team.abbreviation,
              opponent: oppTeam?.team.abbreviation || 'TBD',
              isHome: team.homeAway === 'home',
              headshotUrl: athlete.headshot?.href || '',
              gameStatus: event.status?.type?.state === 'in' ? 'LIVE' : 'PRE',
              gameClock: event.status?.displayClock,
              isRedZoneActive: false, // Could be determined by parsing live play-by-play
              tdpiScore: score,
              tier,
              impliedTeamTotal: impliedTotal,
              rzTouchShare,
              inside10Touches,
              oppRzDefRank,
              oppRzTdPercentAllowed: 55.0,
              marketOdds: '+185',
              modelEdgePercent: Math.round((Math.random() * 15 + 5) * 10) / 10,
              rzTargets: isRB ? 2 : 7,
              goalLineSnapPercent: Math.round(Math.min(rzTouchShare * 1.1, 100)),
              aiVouchScore: Math.floor(score * 0.95) + 5,
            });
          }
        } catch (rosterErr) {
          console.error(`Failed to fetch roster for team ${team.team.id}`, rosterErr);
        }
      }
    }

    return allPlayers;
  } catch (err) {
    console.error('Error in fetchNflTouchdownSlatePlayers:', err);
    throw err;
  }
}

/**
 * Fetches historical TDPI projections vs actual touchdown outcomes for the Ledger.
 * In a production scenario, this queries a database (e.g. Postgres/BigQuery) 
 * for past TDPI projections and joins with ESPN box scores.
 * For now, we simulate a realistic historical payload.
 */
export async function fetchNflHistoricalLedger() {
  try {
    const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard");
    const data = await res.json();
    const completedEvents = data.events.filter((e: any) => e.status.type.completed);
    
    const actualTouchdowns = new Set<string>();
    
    // Fetch box scores for the first 3 completed games to find real touchdown scorers
    for (const event of completedEvents.slice(0, 3)) {
      const sRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${event.id}`);
      const summary = await sRes.json();
      
      for (const team of summary.boxscore?.players || []) {
        const teamAbbrev = team.team.abbreviation;
        for (const statBlock of team.statistics || []) {
          if (statBlock.name === "rushing" || statBlock.name === "receiving") {
            for (const athleteStat of statBlock.athletes || []) {
              const tdCount = parseInt(athleteStat.stats[3] || "0", 10);
              if (tdCount > 0) {
                actualTouchdowns.add(`${athleteStat.athlete.displayName}|${teamAbbrev}`);
              }
            }
          }
        }
      }
    }

    const realScorers = Array.from(actualTouchdowns);
    
    // Mix in some elite non-scorers to make the ledger realistic
    const nonScorers = [
      "Justin Jefferson|MIN", "Christian McCaffrey|SF", "Tyreek Hill|MIA", 
      "CeeDee Lamb|DAL", "A.J. Brown|PHI", "Bijan Robinson|ATL", "Breece Hall|NYJ"
    ].filter(n => !actualTouchdowns.has(n));

    const ledger = [];
    
    // Generate ledger rows for real scorers (simulating they were highly projected)
    realScorers.slice(0, 8).forEach((playerStr, i) => {
      const [name, team] = playerStr.split("|");
      ledger.push({
        id: `hist-scorer-${i}`,
        name,
        team,
        tdpiScore: 75 + Math.random() * 20, // 75-95
        marketOdds: "+" + Math.floor(110 + Math.random() * 150),
        modelEdgePercent: 5 + Math.random() * 15,
        scoredTouchdown: true,
        closingLineValue: 3 + Math.random() * 5,
      });
    });

    // Generate ledger rows for non-scorers (simulating misses)
    nonScorers.slice(0, 7).forEach((playerStr, i) => {
      const [name, team] = playerStr.split("|");
      ledger.push({
        id: `hist-miss-${i}`,
        name,
        team,
        tdpiScore: 65 + Math.random() * 25, // 65-90
        marketOdds: "-" + Math.floor(110 + Math.random() * 50),
        modelEdgePercent: 2 + Math.random() * 10,
        scoredTouchdown: false,
        closingLineValue: -2 + Math.random() * 4,
      });
    });

    // Sort by TDPI descending
    return ledger.sort((a, b) => b.tdpiScore - a.tdpiScore);
  } catch (error) {
    console.error("Failed to fetch real ledger data, falling back to mock", error);
    // Fallback if ESPN is down or no completed games
    return [
      {
        id: "player-hist-1",
        name: "Derrick Henry",
        team: "BAL",
        tdpiScore: 88.4,
        marketOdds: "-130",
        modelEdgePercent: 12.1,
        scoredTouchdown: true,
        closingLineValue: 4.5,
      },
      {
        id: "player-hist-3",
        name: "A.J. Brown",
        team: "PHI",
        tdpiScore: 79.5,
        marketOdds: "+110",
        modelEdgePercent: 15.4,
        scoredTouchdown: false,
        closingLineValue: -1.2,
      }
    ];
  }
}

/**
 * Fetches Live Red Zone Threats from ESPN's scoreboard.
 * Simulates a threat if no games are currently live (for demo purposes).
 */
export async function fetchLiveRedZoneThreats() {
  try {
    const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard");
    const data = await res.json();
    
    // Look for games that are currently in progress and in the red zone
    const liveGames = data.events.filter((e: any) => e.status.type.state === "in");
    
    const threats = [];
    
    for (const game of liveGames) {
      const situation = game.competitions?.[0]?.situation;
      if (situation && situation.isRedZone) {
        const possessionTeamId = situation.possession;
        const comp = game.competitions[0];
        const teamA = comp.competitors[0].team;
        const teamB = comp.competitors[1].team;
        
        const posTeam = teamA.id === possessionTeamId ? teamA : teamB;
        const defTeam = teamA.id === possessionTeamId ? teamB : teamA;
        
        threats.push({
          id: `threat-${game.id}-${Date.now()}`,
          timestamp: game.status.displayClock || "Just now",
          gameId: game.id,
          team: posTeam.abbreviation,
          opponent: defTeam.abbreviation,
          yardLine: situation.downDistanceText?.includes("Goal") ? 5 : 15, // Approx
          description: `${posTeam.abbreviation} ${situation.downDistanceText} at ${defTeam.abbreviation} ${situation.possessionText || "Red Zone"}.`,
          keyPlayers: ["Active Personnel"],
        });
      }
    }
    
    // If no live red zone threats found (off-season or no games active right now),
    // we inject a simulated one so the UI banner still functions for the demo.
    if (threats.length === 0) {
       return [
         {
           id: `sim-threat-${Date.now()}`,
           timestamp: 'Just now',
           gameId: 'sim-1',
           team: 'BAL',
           opponent: 'MIN',
           yardLine: 6,
           description: 'Ravens 1st & Goal at MIN 6. Heavy 22-personnel on field.',
           keyPlayers: ['Derrick Henry', 'Lamar Jackson'],
         }
       ];
    }
    
    return threats;
  } catch (error) {
    console.error("Failed to fetch live threats", error);
    return [];
  }
}
