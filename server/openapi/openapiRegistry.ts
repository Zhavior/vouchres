import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const openapiRegistry = new OpenAPIRegistry();

const RequestMetaSchema = z.object({
  requestId: z.string(),
  timestamp: z.string().datetime(),
}).passthrough().openapi("RequestMeta");

const OkEnvelopeSchema = z.object({
  ok: z.literal(true),
  meta: RequestMetaSchema.optional(),
}).passthrough().openapi("OkEnvelope");

const ErrorEnvelopeSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
    details: z.unknown().optional(),
  }),
  meta: z.object({
    requestId: z.string(),
    timestamp: z.string().datetime(),
  }).optional(),
}).openapi("ErrorEnvelope");

const HealthBackendSchema = z.object({
  ok: z.boolean(),
  status: z.enum(["ok", "degraded"]),
  service: z.string(),
  time: z.string().datetime(),
  productionProof: z.array(z.object({
    id: z.string(),
    label: z.string(),
    ready: z.boolean(),
    detail: z.string(),
  })).optional(),
}).passthrough().openapi("BackendHealth");

const LiveGamesSchema = z.object({
  success: z.literal(true),
  date: z.string(),
  games: z.array(z.object({
    id: z.string(),
    homeTeam: z.string(),
    awayTeam: z.string(),
    homeScore: z.number().nullable(),
    awayScore: z.number().nullable(),
    status: z.string(),
    venue: z.string().nullable(),
    gameDate: z.string().nullable(),
    isLive: z.boolean().optional(),
    isFinal: z.boolean().optional(),
  })),
  warnings: z.array(z.string()).optional(),
  updatedAt: z.string().datetime(),
}).openapi("LiveGamesResponse");

const HrBoardCandidateSchema = z.object({
  playerId: z.union([z.string(), z.number()]).optional(),
  playerName: z.string().optional(),
  team: z.string().optional(),
  lineupStatus: z.enum(["confirmed", "projected_unconfirmed", "projected", "unknown"]).optional(),
  hrScore: z.number().optional(),
  status: z.string().optional(),
  warnings: z.array(z.string()).optional(),
}).passthrough();

const HrBoardTodaySchema = z.object({
  date: z.string(),
  generatedAt: z.string().datetime(),
  dataQuality: z.enum(["validated_hr_board", "projection_preview"]).optional(),
  candidates: z.array(HrBoardCandidateSchema).optional(),
  projectedCandidates: z.array(HrBoardCandidateSchema).optional(),
  counts: z.record(z.string(), z.unknown()).optional(),
  warnings: z.array(z.string()).optional(),
  meta: RequestMetaSchema.optional(),
}).passthrough().openapi("HrBoardTodayResponse");

const AuthMeSchema = z.object({
  ok: z.literal(true),
  id: z.string().uuid(),
  username: z.string().nullable().optional(),
  display_name: z.string().nullable().optional(),
}).passthrough().openapi("AuthMeResponse");

const GradeParlayDocSchema = z.object({
  legs: z.array(z.object({
    sport: z.enum(["mlb", "nba", "nfl"]),
    gamePk: z.string(),
    market: z.string(),
    selection: z.string(),
    oddsDecimal: z.number().optional(),
  })).min(1).max(12),
  stakeUnits: z.number().positive().default(1),
}).openapi("GradeParlayRequest");

const SaveMeParlayDocSchema = z.object({
  title: z.string().max(200).optional(),
  legs: z.array(z.object({
    market: z.string().optional(),
    selection: z.string().optional(),
    gamePk: z.union([z.string(), z.number()]).optional(),
  })).min(1).max(12),
}).passthrough().openapi("SaveMeParlayRequest");

const ListParlaysQueryDocSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
}).openapi("ListParlaysQuery");

const ParlayLegSummarySchema = z.object({
  market: z.string().optional(),
  selection: z.string().optional(),
  gamePk: z.union([z.string(), z.number()]).optional(),
  status: z.string().optional(),
  odds_decimal: z.number().nullable().optional(),
}).passthrough();

const MeParlaysListSchema = z.object({
  ok: z.literal(true),
  parlays: z.array(z.object({
    id: z.string(),
    status: z.string().optional(),
    stake_units: z.number().optional(),
    legs: z.array(ParlayLegSummarySchema).optional(),
  }).passthrough()),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
}).openapi("MeParlaysListResponse");

const GradeParlayResponseSchema = z.object({
  ok: z.literal(true),
  legs: z.array(z.object({
    sport: z.string(),
    gamePk: z.string(),
    market: z.string(),
    selection: z.string(),
    oddsDecimal: z.number().nullable(),
    status: z.enum(["won", "lost", "push", "pending", "error"]),
    actual: z.number().nullable(),
    note: z.string().nullable(),
  })),
  parlay: z.object({
    status: z.enum(["won", "lost", "push", "pending", "error"]),
    settledUnits: z.number().nullable(),
    combinedOdds: z.number().nullable(),
    note: z.string(),
  }),
  gradedAt: z.string().datetime(),
}).openapi("GradeParlayResponse");

const NotificationsListSchema = z.object({
  ok: z.literal(true),
  notifications: z.array(z.record(z.string(), z.unknown())),
  unreadCount: z.number().int().nonnegative(),
  warnings: z.array(z.string()).optional(),
}).openapi("NotificationsListResponse");

const MlbScoresTodaySchema = z.object({
  ok: z.literal(true),
  scores: z.array(z.object({
    gamePk: z.number(),
    status: z.unknown(),
    isLive: z.boolean(),
    isFinal: z.boolean(),
    inning: z.unknown().nullable(),
    inningState: z.string().nullable(),
    score: z.unknown(),
  })),
  updatedAt: z.string().datetime(),
  meta: z.record(z.string(), z.unknown()).optional(),
}).openapi("MlbScoresTodayResponse");

const MlbMatchupsTodaySchema = z.object({
  ok: z.literal(true),
  count: z.number().int().nonnegative(),
  matchups: z.array(z.record(z.string(), z.unknown())),
  updatedAt: z.string().datetime(),
  meta: z.record(z.string(), z.unknown()).optional(),
}).openapi("MlbMatchupsTodayResponse");

const DailyMlbReportSchema = z.object({
  ok: z.literal(true).optional(),
  date: z.string(),
  gameCount: z.number().int().nonnegative().optional(),
  dataQuality: z.string().optional(),
  games: z.array(z.record(z.string(), z.unknown())).optional(),
  hrTargets: z.array(z.record(z.string(), z.unknown())).optional(),
  runEnvironments: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough().openapi("DailyMlbReportResponse");

const AuthSignoutSchema = z.object({
  ok: z.literal(true),
  message: z.string().optional(),
}).openapi("AuthSignoutResponse");

const GradeDueMetaSchema = z.object({
  ok: z.literal(true),
  mode: z.literal("cron_grade_due"),
  gradedParlays: z.number().int().nonnegative(),
  gradedLegs: z.number().int().nonnegative(),
  pendingLegs: z.number().int().nonnegative(),
  summary: z.record(z.string(), z.unknown()),
  warnings: z.array(z.string()).optional(),
  errors: z.array(z.object({
    pick_id: z.string(),
    error: z.string().optional(),
  })).optional(),
  checkedAt: z.string().datetime(),
}).openapi("GradeDueCronResponse");

const HrFeedTodaySchema = z.object({
  count: z.number().int().nonnegative(),
  events: z.array(z.record(z.string(), z.unknown())),
  generatedAt: z.string().datetime(),
  warnings: z.array(z.string()).optional(),
}).openapi("HrFeedTodayResponse");

const LiveAtBatSchema = z.object({
  gamePk: z.number(),
  status: z.string(),
  inning: z.number().nullable(),
  halfInning: z.string().nullable(),
  outs: z.number().nullable(),
  updatedAt: z.string().datetime(),
  play: z.record(z.string(), z.unknown()).nullable().optional(),
}).passthrough().openapi("LiveAtBatSnapshot");

const LiveAtBatEnvelopeSchema = z.object({
  ok: z.literal(true),
  success: z.literal(true),
  data: LiveAtBatSchema,
  meta: z.record(z.string(), z.unknown()).optional(),
}).openapi("LiveAtBatResponse");

const HrBoardPlayerSchema = z.object({
  player: z.record(z.string(), z.unknown()),
}).openapi("HrBoardPlayerResponse");

const UsernameCheckSchema = z.object({
  ok: z.literal(true),
  available: z.boolean(),
  reason: z.string().optional(),
}).openapi("UsernameCheckResponse");

const HandleCheckSchema = z.object({
  ok: z.literal(true),
  available: z.boolean(),
  handle: z.string().optional(),
  reason: z.string().optional(),
}).openapi("HandleCheckResponse");

const BillingStatusSchema = z.object({
  ok: z.literal(true),
  tier: z.string(),
  status: z.string().optional(),
  entitlements: z.record(z.string(), z.unknown()).optional(),
}).passthrough().openapi("BillingStatusResponse");

const BillingCheckoutSchema = z.object({
  tier: z.enum(["pro", "creator"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
}).openapi("BillingCheckoutRequest");

const MlbGamesTodaySchema = z.object({
  ok: z.literal(true),
  date: z.string(),
  games: z.array(z.record(z.string(), z.unknown())),
  warnings: z.array(z.string()).optional(),
}).openapi("MlbGamesTodayResponse");

const MlbLineupTodaySchema = z.object({
  ok: z.literal(true),
  date: z.string(),
  games: z.array(z.object({
    gamePk: z.number(),
    status: z.string(),
    lineupConfirmed: z.boolean(),
    awayLineup: z.array(z.record(z.string(), z.unknown())),
    homeLineup: z.array(z.record(z.string(), z.unknown())),
  }).passthrough()),
  totalGames: z.number().int().nonnegative(),
  totalPlayers: z.number().int().nonnegative(),
  warnings: z.array(z.string()).optional(),
  source: z.string().optional(),
}).passthrough().openapi("MlbLineupTodayResponse");

const MlbHealthSchema = z.object({
  ok: z.boolean(),
  status: z.enum(["ok", "degraded", "down"]),
  date: z.string(),
  warnings: z.array(z.string()).optional(),
}).passthrough().openapi("MlbHealthResponse");

const HrBoardPoolSchema = z.object({
  totalPlayersChecked: z.number().int().nonnegative(),
  confirmedStarters: z.number().int().nonnegative(),
  projectedStarters: z.number().int().nonnegative(),
  benchOrUnknown: z.number().int().nonnegative(),
  injuredScratchedBlocked: z.number().int().nonnegative(),
  hrCandidatesScored: z.number().int().nonnegative(),
}).passthrough().openapi("HrBoardPoolResponse");

const HrBoardDebugSchema = z.object({
  date: z.string(),
  gamesLoaded: z.number().int().nonnegative().optional(),
  candidatesValidated: z.number().int().nonnegative().optional(),
  candidatesBlocked: z.number().int().nonnegative().optional(),
  teamMismatchBlocked: z.number().int().nonnegative().optional(),
  staleDataWarnings: z.array(z.string()).optional(),
  lastRefresh: z.string().optional(),
}).passthrough().openapi("HrBoardDebugResponse");

const NotificationsUnreadCountSchema = z.object({
  ok: z.literal(true),
  notifications: z.array(z.record(z.string(), z.unknown())),
  unreadCount: z.number().int().nonnegative(),
  warnings: z.array(z.string()).optional(),
}).openapi("NotificationsUnreadCountResponse");

const ParlayIntegritySchema = z.object({
  ok: z.literal(true),
  healthy: z.boolean(),
  blockingIssueCount: z.number().int().nonnegative(),
  scanner: z.literal("parlay_integrity_nose"),
  checkedAt: z.string().datetime(),
  issues: z.record(z.string(), z.number().int().nonnegative()),
  cache: z.object({
    gradedLegResults: z.number().int().nonnegative(),
  }),
  advice: z.string(),
}).openapi("ParlayIntegrityResponse");

const AiAgentPluginMetaSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  handle: z.string(),
  tagline: z.string(),
  persona: z.string(),
  specialty: z.string(),
  color: z.string(),
  code: z.string(),
  builtin: z.boolean(),
  singlePickLimit: z.number().int().positive(),
}).openapi("AiAgentPluginMeta");

const AiAgentRegistrySchema = z.object({
  ok: z.literal(true),
  status: z.literal("ready"),
  agents: z.array(AiAgentPluginMetaSchema),
  customSlotEnabled: z.boolean(),
  extensionDocs: z.string(),
}).openapi("AiAgentRegistryResponse");

const AiAgentRunStubSchema = z.object({
  ok: z.literal(true),
  status: z.literal("stub"),
  agentId: z.string(),
  message: z.string(),
}).openapi("AiAgentRunStubResponse");

const FeedListSchema = z.object({
  ok: z.literal(true),
  posts: z.array(z.record(z.string(), z.unknown())),
  total: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  meta: RequestMetaSchema.optional(),
}).openapi("FeedListResponse");

const ParlayEdgeRequestDocSchema = z.object({
  legs: z.array(z.object({
    playerName: z.string().optional(),
    market: z.string().optional(),
    selection: z.string().optional(),
    oddsDecimal: z.number().optional(),
  }).passthrough()).min(1).max(12),
}).openapi("ParlayEdgeRequest");

const ParlayEdgeResponseSchema = z.object({
  ok: z.literal(true),
  edgeScore: z.number().optional(),
  riskLevel: z.string().optional(),
  report: z.string().optional(),
  meta: RequestMetaSchema.optional(),
}).passthrough().openapi("ParlayEdgeResponse");

const AgentGeneratePicksSchema = z.object({
  ok: z.literal(true),
  agent: z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
  }),
  picks: z.array(z.record(z.string(), z.unknown())),
  warnings: z.array(z.string()).optional(),
  meta: RequestMetaSchema.optional(),
}).openapi("AgentGeneratePicksResponse");

openapiRegistry.register("OkEnvelope", OkEnvelopeSchema);
openapiRegistry.register("ErrorEnvelope", ErrorEnvelopeSchema);
openapiRegistry.register("BackendHealth", HealthBackendSchema);
openapiRegistry.register("LiveGamesResponse", LiveGamesSchema);
openapiRegistry.register("HrBoardTodayResponse", HrBoardTodaySchema);
openapiRegistry.register("AuthMeResponse", AuthMeSchema);
openapiRegistry.register("GradeParlayRequest", GradeParlayDocSchema);
openapiRegistry.register("SaveMeParlayRequest", SaveMeParlayDocSchema);
openapiRegistry.register("ListParlaysQuery", ListParlaysQueryDocSchema);
openapiRegistry.register("MeParlaysListResponse", MeParlaysListSchema);
openapiRegistry.register("GradeParlayResponse", GradeParlayResponseSchema);
openapiRegistry.register("NotificationsListResponse", NotificationsListSchema);
openapiRegistry.register("MlbScoresTodayResponse", MlbScoresTodaySchema);
openapiRegistry.register("MlbMatchupsTodayResponse", MlbMatchupsTodaySchema);
openapiRegistry.register("DailyMlbReportResponse", DailyMlbReportSchema);
openapiRegistry.register("AuthSignoutResponse", AuthSignoutSchema);
openapiRegistry.register("GradeDueCronResponse", GradeDueMetaSchema);
openapiRegistry.register("HrFeedTodayResponse", HrFeedTodaySchema);
openapiRegistry.register("LiveAtBatSnapshot", LiveAtBatSchema);
openapiRegistry.register("LiveAtBatResponse", LiveAtBatEnvelopeSchema);
openapiRegistry.register("HrBoardPlayerResponse", HrBoardPlayerSchema);
openapiRegistry.register("UsernameCheckResponse", UsernameCheckSchema);
openapiRegistry.register("HandleCheckResponse", HandleCheckSchema);
openapiRegistry.register("BillingStatusResponse", BillingStatusSchema);
openapiRegistry.register("BillingCheckoutRequest", BillingCheckoutSchema);
openapiRegistry.register("MlbGamesTodayResponse", MlbGamesTodaySchema);
openapiRegistry.register("MlbLineupTodayResponse", MlbLineupTodaySchema);
openapiRegistry.register("MlbHealthResponse", MlbHealthSchema);
openapiRegistry.register("HrBoardPoolResponse", HrBoardPoolSchema);
openapiRegistry.register("HrBoardDebugResponse", HrBoardDebugSchema);
openapiRegistry.register("NotificationsUnreadCountResponse", NotificationsUnreadCountSchema);
openapiRegistry.register("ParlayIntegrityResponse", ParlayIntegritySchema);
openapiRegistry.register("AiAgentPluginMeta", AiAgentPluginMetaSchema);
openapiRegistry.register("AiAgentRegistryResponse", AiAgentRegistrySchema);
openapiRegistry.register("AiAgentRunStubResponse", AiAgentRunStubSchema);
openapiRegistry.register("FeedListResponse", FeedListSchema);
openapiRegistry.register("ParlayEdgeRequest", ParlayEdgeRequestDocSchema);
openapiRegistry.register("ParlayEdgeResponse", ParlayEdgeResponseSchema);
openapiRegistry.register("AgentGeneratePicksResponse", AgentGeneratePicksSchema);

openapiRegistry.registerPath({
  method: "get",
  path: "/api/mlb/matchups/today",
  summary: "Today's matchup research snapshot",
  tags: ["MLB"],
  responses: {
    200: {
      description: "Matchup list",
      content: { "application/json": { schema: MlbMatchupsTodaySchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/mlb/reports/daily",
  summary: "Daily MLB research report",
  tags: ["MLB"],
  request: {
    query: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }),
  },
  responses: {
    200: {
      description: "Daily report",
      content: { "application/json": { schema: DailyMlbReportSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "post",
  path: "/api/auth/signout",
  summary: "Sign out current session",
  tags: ["Auth"],
  responses: {
    200: {
      description: "Signed out",
      content: { "application/json": { schema: AuthSignoutSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/notifications",
  summary: "List authenticated user notifications",
  tags: ["Notifications"],
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
  },
  responses: {
    200: {
      description: "Notification list",
      content: { "application/json": { schema: NotificationsListSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/notifications/unread-count",
  summary: "Authenticated user unread notification count",
  tags: ["Notifications"],
  responses: {
    200: {
      description: "Unread count",
      content: { "application/json": { schema: NotificationsUnreadCountSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/mlb/scores/today",
  summary: "Lightweight live MLB scores (schedule + linescore)",
  tags: ["MLB"],
  responses: {
    200: {
      description: "Today's scores",
      content: { "application/json": { schema: MlbScoresTodaySchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/cron/parlays/integrity",
  summary: "Cron: parlay grading identity health scan (Bearer CRON_SECRET)",
  tags: ["Cron"],
  responses: {
    200: {
      description: "Integrity report",
      content: { "application/json": { schema: ParlayIntegritySchema } },
    },
    401: {
      description: "Unauthorized cron",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/cron/parlays/grade-due",
  summary: "Cron: grade pending picks (Bearer CRON_SECRET)",
  tags: ["Cron"],
  request: {
    query: z.object({
      days: z.coerce.number().int().min(1).max(7).optional(),
    }),
  },
  responses: {
    200: {
      description: "Grade run summary with meta",
      content: { "application/json": { schema: GradeDueMetaSchema } },
    },
    401: {
      description: "Unauthorized cron",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/health/backend",
  summary: "Backend ops health and production-readiness checklist (staff-only)",
  tags: ["Health"],
  responses: {
    200: {
      description: "Health report",
      content: { "application/json": { schema: HealthBackendSchema } },
    },
    401: {
      description: "Missing or invalid auth",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
    403: {
      description: "Staff access required",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/mlb/live",
  summary: "Official MLB schedule with live scores",
  tags: ["MLB"],
  responses: {
    200: {
      description: "Live games payload",
      content: { "application/json": { schema: LiveGamesSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/mlb/hr-board/today",
  summary: "Validated HR board for today",
  tags: ["MLB"],
  request: {
    query: z.object({
      previewLimit: z.coerce.number().int().min(1).max(200).optional(),
    }),
  },
  responses: {
    200: {
      description: "HR board",
      content: { "application/json": { schema: HrBoardTodaySchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/auth/me",
  summary: "Current authenticated user profile",
  tags: ["Auth"],
  responses: {
    200: {
      description: "Profile",
      content: { "application/json": { schema: AuthMeSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "post",
  path: "/api/parlays/save",
  summary: "Save a canonical user parlay slip",
  tags: ["Parlays"],
  request: {
    body: {
      content: { "application/json": { schema: SaveMeParlayDocSchema } },
    },
  },
  responses: {
    200: {
      description: "Saved parlay",
      content: { "application/json": { schema: OkEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "post",
  path: "/api/parlays/grade",
  summary: "Stateless parlay grade preview (no DB writes)",
  tags: ["Parlays"],
  request: {
    body: {
      content: { "application/json": { schema: GradeParlayDocSchema } },
    },
  },
  responses: {
    200: {
      description: "Graded legs",
      content: { "application/json": { schema: GradeParlayResponseSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/me/parlays",
  summary: "List authenticated user's saved parlays",
  tags: ["Parlays"],
  request: { query: ListParlaysQueryDocSchema },
  responses: {
    200: {
      description: "Parlay list",
      content: { "application/json": { schema: MeParlaysListSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/mlb/hr-feed/today",
  summary: "Real home-run plays from today's MLB games",
  tags: ["MLB"],
  responses: {
    200: {
      description: "HR feed",
      content: { "application/json": { schema: HrFeedTodaySchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/mlb/live-at-bat/{gamePk}",
  summary: "Pitch-by-pitch live at-bat snapshot for one game",
  tags: ["MLB"],
  request: {
    params: z.object({
      gamePk: z.coerce.number().int().positive(),
    }),
  },
  responses: {
    200: {
      description: "Live at-bat snapshot",
      content: { "application/json": { schema: LiveAtBatEnvelopeSchema } },
    },
    404: {
      description: "Game feed unavailable",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/mlb/hr-board/player/{playerId}",
  summary: "Single validated HR board player detail",
  tags: ["MLB"],
  request: {
    params: z.object({
      playerId: z.coerce.number().int().positive(),
    }),
    query: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }),
  },
  responses: {
    200: {
      description: "Player detail",
      content: { "application/json": { schema: HrBoardPlayerSchema } },
    },
    404: {
      description: "Player not in validated candidates",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/auth/username-check",
  summary: "Public username availability check",
  tags: ["Auth"],
  request: {
    query: z.object({
      username: z.string().min(3).max(24),
    }),
  },
  responses: {
    200: {
      description: "Availability result",
      content: { "application/json": { schema: UsernameCheckSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/auth/handle-check",
  summary: "Public @handle availability check (query param)",
  tags: ["Auth"],
  request: {
    query: z.object({
      handle: z.string().min(3).max(24),
    }),
  },
  responses: {
    200: {
      description: "Handle availability result",
      content: { "application/json": { schema: HandleCheckSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/users/handle/{handle}",
  summary: "Public @handle availability check (path param)",
  tags: ["Users"],
  request: {
    params: z.object({
      handle: z.string().min(3).max(24),
    }),
  },
  responses: {
    200: {
      description: "Handle availability result",
      content: { "application/json": { schema: HandleCheckSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/billing/status",
  summary: "Authenticated subscription tier and entitlements",
  tags: ["Billing"],
  responses: {
    200: {
      description: "Billing status",
      content: { "application/json": { schema: BillingStatusSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "post",
  path: "/api/billing/checkout",
  summary: "Create Stripe checkout session",
  tags: ["Billing"],
  request: {
    body: {
      content: { "application/json": { schema: BillingCheckoutSchema } },
    },
  },
  responses: {
    200: {
      description: "Checkout session URL",
      content: { "application/json": { schema: OkEnvelopeSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "post",
  path: "/api/parlays/grade-due",
  summary: "Staff: grade all pending picks (systemwide)",
  tags: ["Parlays"],
  request: {
    query: z.object({
      days: z.coerce.number().int().min(1).max(7).optional(),
    }),
  },
  responses: {
    200: {
      description: "Grade run summary",
      content: { "application/json": { schema: GradeDueMetaSchema } },
    },
    403: {
      description: "Staff only",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/mlb/games/today",
  summary: "Today's MLB schedule games",
  tags: ["MLB"],
  responses: {
    200: {
      description: "Today's games",
      content: { "application/json": { schema: MlbGamesTodaySchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/mlb/lineup/today",
  summary: "Today's official batting lineups",
  tags: ["MLB"],
  request: {
    query: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }),
  },
  responses: {
    200: {
      description: "Lineup board",
      content: { "application/json": { schema: MlbLineupTodaySchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/health/mlb",
  summary: "MLB upstream health probe",
  tags: ["Health"],
  request: {
    query: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }),
  },
  responses: {
    200: {
      description: "MLB health",
      content: { "application/json": { schema: MlbHealthSchema } },
    },
    503: {
      description: "MLB upstream down",
      content: { "application/json": { schema: MlbHealthSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/mlb/hr-board/today/pool",
  summary: "Today player pool summary for validated HR board",
  tags: ["MLB"],
  responses: {
    200: {
      description: "Pool summary",
      content: { "application/json": { schema: HrBoardPoolSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/mlb/hr-board/today/debug",
  summary: "Debug counts and warnings for validated HR board pipeline",
  tags: ["MLB"],
  responses: {
    200: {
      description: "Debug payload",
      content: { "application/json": { schema: HrBoardDebugSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/mlb/hr-board/date/{date}",
  summary: "Validated HR board for a specific date",
  tags: ["MLB"],
  request: {
    params: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
    query: z.object({
      previewLimit: z.coerce.number().int().min(1).max(350).optional(),
    }),
  },
  responses: {
    200: {
      description: "HR board",
      content: { "application/json": { schema: HrBoardTodaySchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/ai-judges/registry",
  summary: "List registered AI judge agent plugins (metadata only)",
  tags: ["AI Judges"],
  responses: {
    200: {
      description: "Agent registry",
      content: { "application/json": { schema: AiAgentRegistrySchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "post",
  path: "/api/ai-judges/agents/{id}/run",
  summary: "Staff-only stub for future external agent runners",
  tags: ["AI Judges"],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "Stub acknowledgement",
      content: { "application/json": { schema: AiAgentRunStubSchema } },
    },
    404: {
      description: "Agent not found",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/feed",
  summary: "Home feed (personalized when authenticated)",
  tags: ["Feed"],
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).optional(),
      offset: z.coerce.number().int().min(0).optional(),
    }),
  },
  responses: {
    200: {
      description: "Feed posts",
      content: { "application/json": { schema: FeedListSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "post",
  path: "/api/ai/parlay-edge",
  summary: "AI parlay edge report (quota-gated)",
  tags: ["AI"],
  request: {
    body: {
      content: { "application/json": { schema: ParlayEdgeRequestDocSchema } },
    },
  },
  responses: {
    200: {
      description: "Parlay edge analysis",
      content: { "application/json": { schema: ParlayEdgeResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
    429: {
      description: "Daily quota exceeded",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "post",
  path: "/api/agents/{id}/generate-picks",
  summary: "Generate capper agent picks for a date (quota-gated)",
  tags: ["Agents"],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Generated picks",
      content: { "application/json": { schema: AgentGeneratePicksSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
    429: {
      description: "Daily quota exceeded",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "patch",
  path: "/api/auth/profile",
  summary: "Update authenticated user profile",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            username: z.string().min(3).max(24).optional(),
            display_name: z.string().max(64).optional(),
            bio: z.string().max(500).optional(),
            avatar_url: z.string().url().max(500).nullable().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated profile",
      content: { "application/json": { schema: AuthMeSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorEnvelopeSchema } },
    },
  },
});

export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(openapiRegistry.definitions);
  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "VouchEdge API",
      version: "0.3.0",
      description: "Phase 4 OpenAPI — MLB, parlay, auth, billing, notifications, cron, and health routes.",
    },
    servers: [{ url: "/", description: "Current host" }],
  });
}
