/**
 * HR Master Intelligence Routes
 *
 * POST /api/mlb/hr-intelligence/evaluate — deterministic HR probability engine
 * Accepts structured slate input per VouchEdge Master HR Intelligence contract.
 */
import type { Express, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { apiOkFlat } from "../lib/apiResponse";
import type { RequestWithContext } from "../middleware/requestContext";
import { mlbReadLimiter } from "../middleware/rateLimit";
import {
  formatEngineResultMarkdown,
  runHrMasterEngine,
  type HrMasterSlateInput,
} from "../services/intelligence/hrMaster";

const seasonMetricsSchema = z.object({
  EV: z.number(),
  FB_percent: z.number(),
  HH_percent: z.number(),
  Barrel_percent: z.number(),
  xwOBAcon: z.number(),
  pull_air_percent: z.number(),
  avg_launch_angle: z.number(),
  sweet_spot_percent: z.number(),
});

const batterSchema = z.object({
  batter_id: z.number(),
  batter_name: z.string(),
  team: z.string(),
  handedness: z.enum(["L", "R", "S"]),
  projected_lineup_spot: z.number().int().min(1).max(9),
  projected_plate_appearances: z.number().positive(),
  starter_probability: z.number().min(0).max(1),
  season_metrics: seasonMetricsSchema,
  rolling_30d_metrics: seasonMetricsSchema.extend({ air_hard_hit_rate: z.number() }),
  rolling_14d_bbe_log: z.array(
    z.object({
      event_date: z.string(),
      launch_angle: z.number(),
      exit_velocity: z.number(),
      barrel_flag: z.boolean(),
      spray_direction: z.enum(["pull", "center", "oppo"]),
    }),
  ),
  pitch_type_skill: z.object({
    xwOBA_vs_4seam: z.number().optional(),
    xwOBA_vs_sinker: z.number().optional(),
    xwOBA_vs_cutter: z.number().optional(),
    xwOBA_vs_slider: z.number().optional(),
    xwOBA_vs_curve: z.number().optional(),
    xwOBA_vs_changeup: z.number().optional(),
    sample_4seam: z.number().optional(),
    sample_sinker: z.number().optional(),
    sample_cutter: z.number().optional(),
    sample_slider: z.number().optional(),
    sample_curve: z.number().optional(),
    sample_changeup: z.number().optional(),
  }),
  split_profile: z.object({
    platoon_split_delta: z.number(),
    pull_side_hr_fit: z.number(),
  }),
});

const slateSchema = z.object({
  game: z.object({
    game_id: z.string(),
    date: z.string(),
    away_team: z.string(),
    home_team: z.string(),
    ballpark: z.string(),
    roof_status: z.enum(["open", "closed", "retractable", "unknown"]),
    game_time_local: z.string(),
    implied_team_totals: z.object({ away: z.number(), home: z.number() }),
    confirmed_lineups_status: z.enum(["confirmed", "projected", "unknown"]),
  }),
  batters: z.array(
    z.object({
      batter: batterSchema,
      opposing_pitcher: z.object({
        pitcher_id: z.number(),
        pitcher_name: z.string(),
        handedness: z.enum(["L", "R", "S"]),
        projected_innings: z.number().positive(),
        pitch_mix_usage: z.object({
          four_seam: z.number(),
          sinker: z.number(),
          cutter: z.number(),
          slider: z.number(),
          curve: z.number(),
          changeup: z.number(),
        }),
        swinging_strike_percent: z.number(),
        whiff_percent: z.number(),
        HR_per_FB_allowed: z.number(),
        barrel_percent_allowed: z.number(),
        fly_ball_percent_allowed: z.number(),
        xSLG_allowed: z.number(),
        FIP: z.number(),
        xFIP: z.number(),
      }),
      opposing_bullpen: z.object({
        bullpen_id: z.string(),
        last_3_days_pitch_count: z.number(),
        last_2_days_high_leverage_usage: z.number(),
        projected_available_relievers: z.number(),
        bullpen_HR_per_FB: z.number(),
        bullpen_xFIP: z.number(),
        bullpen_barrel_percent_allowed: z.number(),
        bullpen_fatigue_index: z.number(),
      }),
      environment: z.object({
        temperature: z.number(),
        humidity: z.number(),
        wind_speed: z.number(),
        wind_direction: z.string(),
        wind_vector_outbound_mph: z.number(),
        park_factor_hr_overall: z.number(),
        park_factor_pull_left: z.number(),
        park_factor_pull_right: z.number(),
        park_factor_center: z.number(),
        weather_confidence: z.number().min(0).max(1),
      }),
      market: z.object({
        sportsbook_name: z.string(),
        market_timestamp: z.string(),
        american_odds: z.number(),
        decimal_odds: z.number().gt(1),
        implied_probability_raw: z.number(),
        best_available_price_flag: z.boolean(),
        market_limit_quality: z.number(),
        consensus_price: z.number().optional(),
        consensus_implied_probability: z.number().optional(),
      }),
    }),
  ).min(1),
});

export function registerHrMasterIntelligenceRoutes(app: Express): void {
  app.post(
    "/api/mlb/hr-intelligence/evaluate",
    mlbReadLimiter,
    asyncHandler(async (req: RequestWithContext, res: Response) => {
      const parsed = z.union([slateSchema, z.object({ slates: z.array(slateSchema).min(1) })]).safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          ok: false,
          error: "Invalid HR intelligence input contract",
          details: parsed.error.flatten(),
        });
        return;
      }

      const slates: HrMasterSlateInput[] =
        "slates" in parsed.data ? (parsed.data.slates as HrMasterSlateInput[]) : [parsed.data as HrMasterSlateInput];

      const result = runHrMasterEngine(slates);
      const format = req.query.format === "markdown" ? "markdown" : "json";

      if (format === "markdown") {
        res.type("text/markdown").send(formatEngineResultMarkdown(result.games));
        return;
      }

      res.json(apiOkFlat(req, {
        ...result,
        contractVersion: "hr-intelligence-master.v1",
      }));
    }),
  );
}
