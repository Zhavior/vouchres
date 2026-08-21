import { fetchNflTouchdownSlatePlayers } from "./server/services/nfl/nflEspnService";

async function run() {
  const players = await fetchNflTouchdownSlatePlayers();
  console.log("Total players:", players.length);
  const teams: Record<string, number> = {};
  for (const p of players) {
    teams[p.team] = (teams[p.team] || 0) + 1;
  }
  console.log(teams);
}
run();
