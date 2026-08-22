import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "../../middleware/auth";
import type { TdBoardV2Snapshot } from "./contracts/tdBoardV2";

function persistenceEnabled(): boolean {
  return process.env.TD_BOARD_V2_PERSIST === "true";
}

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function persistTdBoardV2Snapshot(
  slateDate: string,
  snapshot: TdBoardV2Snapshot,
): Promise<{ persisted: boolean; reason?: string }> {
  if (!persistenceEnabled()) return { persisted: false, reason: "disabled" };
  if (snapshot.connection !== "live" && snapshot.connection !== "partial") {
    return { persisted: false, reason: "not_source_backed" };
  }

  const db = await getSupabaseAdmin();
  const digest = sha256(snapshot);
  const { data: board, error: boardError } = await db
    .from("nfl_td_board_snapshots")
    .upsert({
      slate_date: slateDate,
      model_version: snapshot.version,
      provider: snapshot.source,
      provider_updated_at: snapshot.sourceUpdatedAt,
      ingested_at: snapshot.ingestedAt,
      connection_state: snapshot.connection,
      data_quality: snapshot.dataQuality,
      payload: snapshot,
      payload_sha256: digest,
    }, { onConflict: "slate_date,model_version,provider,payload_sha256" })
    .select("id")
    .single();

  if (boardError || !board?.id) {
    throw new Error(`TD board snapshot write failed: ${boardError?.message ?? "missing id"}`);
  }

  if (snapshot.players.length > 0) {
    const rows = snapshot.players.map((player) => ({
      board_snapshot_id: board.id,
      provider_player_id: player.id,
      player_name: player.name,
      team: player.team,
      opponent: player.opponent,
      features: {
        impliedTeamTotal: player.impliedTeamTotal,
        rzTouchShare: player.rzTouchShare,
        inside10Touches: player.inside10Touches,
        oppRzDefRank: player.oppRzDefRank,
        oppRzTdPercentAllowed: player.oppRzTdPercentAllowed,
      },
      field_sources: player.provenance.fields,
      model_score: player.tdpiScore,
      market_odds: Number(player.marketOdds),
    }));
    const { error } = await db
      .from("nfl_td_candidate_snapshots")
      .upsert(rows, { onConflict: "board_snapshot_id,provider_player_id" });
    if (error) throw new Error(`TD candidate snapshot write failed: ${error.message}`);
  }

  return { persisted: true };
}
