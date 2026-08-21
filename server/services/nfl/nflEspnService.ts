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

  return events.map((event: any) => {
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
}
