import {
  getPlayerCount,
  getPlayerRegistryPayload,
  getPlayerRegistryStatus,
  PlayerRegistryEntry,
} from "../server/services/mlb/playerRegistryService";

async function verifyPlayerRegistryBridge() {
  console.log("=== Verifying MLB Player Registry Anti-Gravity Bridge ===");

  // 1. Check current status
  const status = getPlayerRegistryStatus();
  console.log("\n[1/4] Current Registry Status:", status);

  if (typeof status.ready !== "boolean") {
    throw new Error("status.ready must be a boolean");
  }
  if (typeof status.stale !== "boolean") {
    throw new Error("status.stale must be a boolean");
  }
  if (typeof status.warming !== "boolean") {
    throw new Error("status.warming must be a boolean");
  }
  if (status.source !== "live_cache" && status.source !== "snapshot") {
    throw new Error(`Invalid status.source: ${String(status.source)}`);
  }

  // 2. Check getPlayerCount()
  const countResult = await getPlayerCount();
  console.log("\n[2/4] getPlayerCount():", countResult);
  if (typeof countResult.count !== "number") {
    throw new Error("countResult.count must be a number");
  }
  if (!countResult.updatedAt || !countResult.attemptedAt) {
    throw new Error("countResult missing updatedAt or attemptedAt");
  }

  // 3. Check getPlayerRegistryPayload()
  console.log("\n[3/4] Fetching full registry payload...");
  const payload = await getPlayerRegistryPayload();
  console.log(`Received ${payload.players.length} players. Source: ${payload.source}, Stale: ${payload.stale}, Warming: ${payload.warming}`);

  if (!Array.isArray(payload.players)) {
    throw new Error("payload.players must be an array");
  }
  if (payload.count !== payload.players.length) {
    throw new Error(`Mismatch between payload.count (${payload.count}) and payload.players.length (${payload.players.length})`);
  }

  if (payload.players.length > 0) {
    const sample = payload.players[0];
    console.log("\nSample Player Entry:", {
      playerId: sample.playerId,
      name: sample.playerName,
      team: sample.team,
      position: sample.position,
      rosterType: sample.rosterType,
    });
  } else {
    console.log("Registry is currently empty (cold state without snapshot).");
  }

  console.log("\n✅ All Player Registry Anti-Gravity Bridge checks passed successfully!");
}

verifyPlayerRegistryBridge().catch((err) => {
  console.error("\n❌ Verification failed:", err);
  process.exit(1);
});
