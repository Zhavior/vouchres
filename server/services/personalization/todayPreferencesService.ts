import { z } from "zod";
import { getSupabaseAdmin } from "../../middleware/auth";

export const MLB_TEAM_IDS = [
  108, 109, 110, 111, 112, 113, 114, 115, 116, 117,
  118, 119, 120, 121, 133, 134, 135, 136, 137, 138,
  139, 140, 141, 142, 143, 144, 145, 146, 147, 158,
] as const;

export const TODAY_RESEARCH_INTERESTS = [
  "home_runs",
  "pitching_matchups",
  "lineup_status",
  "weather_park_factors",
  "player_form",
  "live_games",
  "active_slips",
  "results_accountability",
] as const;

export const TODAY_IN_APP_ALERT_TYPES = [
  "favorite_team_game_state",
  "followed_player_lineup",
  "research_change",
  "tracked_result",
] as const;

const MlbTeamIdSchema = z.number().int().refine(
  (value) => (MLB_TEAM_IDS as readonly number[]).includes(value),
  "Unknown MLB team ID.",
);

const FollowedMlbPlayerSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(80),
}).strict();

function hasDuplicates<T>(values: readonly T[]): boolean {
  return new Set(values).size !== values.length;
}

export const TodayPreferencesPutSchema = z.object({
  favoriteMlbTeamIds: z.array(MlbTeamIdSchema).max(5),
  followedPlayers: z.array(FollowedMlbPlayerSchema).max(50),
  researchInterests: z.array(z.enum(TODAY_RESEARCH_INTERESTS)).max(8),
  inAppAlertTypes: z.array(z.enum(TODAY_IN_APP_ALERT_TYPES)).max(4).default([]),
}).strict().superRefine((value, ctx) => {
  if (hasDuplicates(value.favoriteMlbTeamIds)) {
    ctx.addIssue({
      code: "custom",
      path: ["favoriteMlbTeamIds"],
      message: "Favorite MLB teams must be unique.",
    });
  }
  if (hasDuplicates(value.followedPlayers.map((player) => player.id))) {
    ctx.addIssue({
      code: "custom",
      path: ["followedPlayers"],
      message: "Followed MLB player IDs must be unique.",
    });
  }
  if (hasDuplicates(value.researchInterests)) {
    ctx.addIssue({
      code: "custom",
      path: ["researchInterests"],
      message: "Research interests must be unique.",
    });
  }
  if (hasDuplicates(value.inAppAlertTypes)) {
    ctx.addIssue({
      code: "custom",
      path: ["inAppAlertTypes"],
      message: "In-app alert types must be unique.",
    });
  }
});

export type TodayPreferencesInput = z.infer<typeof TodayPreferencesPutSchema>;

export interface TodayPreferences {
  favoriteMlbTeamIds: number[];
  followedPlayers: Array<{ id: number; name: string }>;
  researchInterests: Array<(typeof TODAY_RESEARCH_INTERESTS)[number]>;
  inAppAlertTypes: Array<(typeof TODAY_IN_APP_ALERT_TYPES)[number]>;
  updatedAt: string | null;
}

export const DEFAULT_TODAY_PREFERENCES: TodayPreferences = Object.freeze({
  favoriteMlbTeamIds: [],
  followedPlayers: [],
  researchInterests: [],
  inAppAlertTypes: [],
  updatedAt: null,
});

type TodayPreferencesRow = {
  favorite_mlb_team_ids: number[] | null;
  followed_mlb_player_ids: number[] | null;
  followed_mlb_player_names: string[] | null;
  research_interests: string[] | null;
  in_app_alert_types: string[] | null;
  updated_at: string | null;
};

function mapPreferences(row: TodayPreferencesRow): TodayPreferences {
  const ids = row.followed_mlb_player_ids ?? [];
  const names = row.followed_mlb_player_names ?? [];
  return {
    favoriteMlbTeamIds: row.favorite_mlb_team_ids ?? [],
    followedPlayers: ids.map((id, index) => ({ id, name: names[index] ?? "" })),
    researchInterests: (row.research_interests ?? []) as TodayPreferences["researchInterests"],
    inAppAlertTypes: (row.in_app_alert_types ?? []) as TodayPreferences["inAppAlertTypes"],
    updatedAt: row.updated_at ?? null,
  };
}

export async function getTodayPreferences(userId: string): Promise<TodayPreferences> {
  const admin = await getSupabaseAdmin();
  const { data, error } = await admin
    .from("today_personalization_preferences")
    .select(
      "favorite_mlb_team_ids, followed_mlb_player_ids, followed_mlb_player_names, research_interests, in_app_alert_types, updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapPreferences(data as TodayPreferencesRow) : { ...DEFAULT_TODAY_PREFERENCES };
}

export async function replaceTodayPreferences(
  userId: string,
  input: TodayPreferencesInput,
): Promise<TodayPreferences> {
  const admin = await getSupabaseAdmin();
  const { data, error } = await admin
    .from("today_personalization_preferences")
    .upsert({
      user_id: userId,
      favorite_mlb_team_ids: input.favoriteMlbTeamIds,
      followed_mlb_player_ids: input.followedPlayers.map((player) => player.id),
      followed_mlb_player_names: input.followedPlayers.map((player) => player.name),
      research_interests: input.researchInterests,
      in_app_alert_types: input.inAppAlertTypes,
    }, { onConflict: "user_id" })
    .select(
      "favorite_mlb_team_ids, followed_mlb_player_ids, followed_mlb_player_names, research_interests, in_app_alert_types, updated_at",
    )
    .single();

  if (error) throw error;
  return mapPreferences(data as TodayPreferencesRow);
}
