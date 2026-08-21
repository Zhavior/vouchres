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
