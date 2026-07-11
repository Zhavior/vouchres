import { AppError } from "../../errors/AppError";
import { getSupabaseAdmin } from "../../middleware/auth";
import { findLegsForPick } from "../../repositories/parlayRepository";
import type { SaveMeParlayInput } from "../../validators/parlaySchemas";
import { saveUserParlay } from "../parlays/parlayCreationService";
import { upsertFollow } from "./followService";
import { createParlayTailedNotification } from "../notifications/notificationService";

const MISSING_TABLE_CODES = new Set(["42P01", "PGRST205", "PGRST204"]);

function missingTable(error: unknown): boolean {
  return MISSING_TABLE_CODES.has(String((error as { code?: unknown })?.code ?? ""));
}

async function canViewPickForTail(input: {
  pickId: string;
  viewerId: string;
}): Promise<{ pick: Record<string, unknown>; ownerId: string }> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data: pick, error } = await supabaseAdmin
    .from("picks")
    .select("id, user_id, visibility, leg_type, explanation, odds_decimal, stake_units, sport, selection, locked_at")
    .eq("id", input.pickId)
    .eq("leg_type", "parlay")
    .maybeSingle();

  if (error || !pick) {
    throw new AppError({ status: 404, code: "not_found", message: "Parlay not found." });
  }

  const ownerId = String(pick.user_id ?? "");
  if (ownerId === input.viewerId) {
    return { pick, ownerId };
  }

  const visibility = String(pick.visibility ?? "private");
  if (visibility === "public") {
    return { pick, ownerId };
  }

  const { data: follow } = await supabaseAdmin
    .from("follows")
    .select("follower_id")
    .eq("follower_id", input.viewerId)
    .eq("following_profile_id", ownerId)
    .maybeSingle();

  if (follow) return { pick, ownerId };

  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("id")
    .eq("pick_id", input.pickId)
    .limit(1)
    .maybeSingle();

  if (post) return { pick, ownerId };

  throw new AppError({
    status: 403,
    code: "forbidden",
    message: "You cannot tail this parlay.",
  });
}

function mapLegForSave(leg: Record<string, unknown>, index: number) {
  return {
    event_id: leg.event_id ?? leg.game_id ?? leg.gamePk ?? leg.game_pk,
    game_id: leg.game_id ?? leg.event_id ?? leg.gamePk ?? leg.game_pk,
    gamePk: leg.gamePk ?? leg.game_pk ?? leg.game_id,
    team_id: leg.team_id ?? leg.teamId,
    teamId: leg.teamId ?? leg.team_id,
    player_id: leg.player_id ?? leg.playerId,
    playerId: leg.playerId ?? leg.player_id,
    playerName: leg.player_name ?? leg.playerName,
    market: leg.market,
    market_code: leg.market_code ?? leg.marketCode,
    selection: leg.selection,
    odds: leg.odds_decimal ?? leg.odds ?? leg.oddsDecimal,
    odds_decimal: leg.odds_decimal ?? leg.oddsDecimal ?? leg.odds,
    sport: leg.sport,
    stat_target: leg.stat_target ?? leg.statTarget,
    comparator: leg.comparator,
    external_provider: leg.external_provider ?? leg.externalProvider,
    leg_index: index,
  };
}

export async function tailParlayForUser(input: {
  userId: string;
  sourcePickId: string;
  sourcePostId?: string | null;
}): Promise<{ parlay: Record<string, unknown>; tailedPickId: string }> {
  const { pick, ownerId } = await canViewPickForTail({
    pickId: input.sourcePickId,
    viewerId: input.userId,
  });

  const legs = await findLegsForPick(input.sourcePickId);
  if (legs.length < 1) {
    throw new AppError({ status: 400, code: "bad_request", message: "Parlay has no legs to tail." });
  }

  const clientRef = `tail:${input.sourcePickId}:${input.userId}`;
  const title = String(pick.explanation ?? pick.selection ?? "Tailed parlay").slice(0, 180);

  const saved = await saveUserParlay({
    userId: input.userId,
    body: {
      title,
      sport: String(pick.sport ?? "MLB"),
      stake_units: pick.stake_units != null ? Number(pick.stake_units) : 1,
      source: "tailed_parlay",
      client_ref: clientRef,
      legs: legs.map((leg, index) => mapLegForSave(leg as Record<string, unknown>, index)) as SaveMeParlayInput["legs"],
    },
  });

  const tailedPickId = String(saved.body.id);

  const supabaseAdmin = await getSupabaseAdmin();
  const { error: tailError } = await supabaseAdmin.from("parlay_tails").upsert(
    {
      user_id: input.userId,
      source_pick_id: input.sourcePickId,
      tailed_pick_id: tailedPickId,
      source_user_id: ownerId || null,
      source_post_id: input.sourcePostId ?? null,
    },
    { onConflict: "user_id,source_pick_id" },
  );

  if (tailError && !missingTable(tailError)) {
    console.warn("[tailParlay] parlay_tails insert failed", tailError.message);
  }

  if (ownerId && ownerId !== input.userId) {
    await upsertFollow({
      followerId: input.userId,
      followingProfileId: ownerId,
      relationshipType: "tail",
      notifyEnabled: true,
    }).catch((err) => {
      console.warn("[tailParlay] follow upsert failed", (err as Error)?.message);
    });

    await createParlayTailedNotification({
      sourceUserId: ownerId,
      tailedByUserId: input.userId,
      sourcePickId: input.sourcePickId,
      tailedPickId,
    }).catch((err) => {
      console.warn("[tailParlay] notification failed", (err as Error)?.message);
    });
  }

  return { parlay: saved.body as Record<string, unknown>, tailedPickId };
}
