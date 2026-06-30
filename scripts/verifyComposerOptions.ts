import {
  clearFeedComposerCache,
  getFeedComposerDiagnostics,
  getFeedComposerOptions,
  resetFeedComposerDiagnostics,
} from "../server/services/feed/composerOptionsService";

const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);

clearFeedComposerCache();
resetFeedComposerDiagnostics();

const responses = await Promise.all(
  Array.from({ length: 3 }, () => getFeedComposerOptions({ sport: "MLB", date }))
);

const diagnostics = getFeedComposerDiagnostics();
const first = responses[0];

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

assert(first.sport === "MLB", "sport must be MLB");
assert(first.date === date, `date must be ${date}`);
assert(Array.isArray(first.games), "games must be an array");
assert(Array.isArray(first.markets), "markets must be an array");
assert(Array.isArray(first.warnings), "warnings must be an array");
assert(first.markets.some((market) => market.id === "CUSTOM"), "markets must include CUSTOM");

if (first.games.length === 0) {
  assert(first.warnings.length > 0, "empty games must include an explanatory warning");
}

for (const game of first.games) {
  assert(typeof game.gameId === "string" && game.gameId.length > 0, "game.gameId must be a non-empty string");
  assert(typeof game.label === "string" && game.label.length > 0, "game.label must be a non-empty string");
  assert(game.awayTeam && game.homeTeam, "game must include awayTeam and homeTeam");
  assert(Array.isArray(game.awayTeam.players), "awayTeam.players must be an array");
  assert(Array.isArray(game.homeTeam.players), "homeTeam.players must be an array");
  if (game.awayTeam.players.length === 0 || game.homeTeam.players.length === 0) {
    assert(first.warnings.length > 0, "empty player arrays must include warnings");
  }
  for (const player of [...game.awayTeam.players, ...game.homeTeam.players]) {
    assert(typeof player.id === "string" && player.id.length > 0, "player.id must be a non-empty string");
    assert(typeof player.name === "string" && player.name.length > 0, "player.name must be a non-empty string");
    assert(player.teamId === game.awayTeam.id || player.teamId === game.homeTeam.id, "player.teamId must match a game team");
    assert(typeof player.isStarter === "boolean", "player.isStarter must be boolean");
    assert(player.battingOrder === null || typeof player.battingOrder === "number", "player.battingOrder must be number|null");
  }
}

assert(diagnostics.producerRuns === 1, `expected one composer producer run, got ${diagnostics.producerRuns}`);
assert(diagnostics.inflightReuses >= 2, `expected at least two in-flight reuses, got ${diagnostics.inflightReuses}`);

const playerCount = first.games.reduce(
  (sum, game) => sum + game.awayTeam.players.length + game.homeTeam.players.length,
  0
);

console.log(
  JSON.stringify(
    {
      ok: true,
      sport: first.sport,
      date: first.date,
      games: first.games.length,
      players: playerCount,
      warnings: first.warnings,
      cache: diagnostics,
    },
    null,
    2
  )
);

