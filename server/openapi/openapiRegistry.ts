import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { GradeParlaySchema, ListParlaysQuerySchema, ParlayIdParamsSchema, SaveMeParlaySchema } from "../validators/parlaySchemas";

extendZodWithOpenApi(z);

export const openapiRegistry = new OpenAPIRegistry();

const OkEnvelopeSchema = z.object({
  ok: z.literal(true),
}).passthrough().openapi("OkEnvelope");

const ErrorEnvelopeSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
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

const HrBoardTodaySchema = z.object({
  date: z.string(),
  generatedAt: z.string().datetime(),
  confirmedCandidates: z.array(z.record(z.string(), z.unknown())).optional(),
  projectedCandidates: z.array(z.record(z.string(), z.unknown())).optional(),
  warnings: z.array(z.string()).optional(),
}).passthrough().openapi("HrBoardTodayResponse");

const AuthMeSchema = z.object({
  ok: z.literal(true),
  id: z.string().uuid(),
  username: z.string().nullable().optional(),
  display_name: z.string().nullable().optional(),
}).passthrough().openapi("AuthMeResponse");

openapiRegistry.register("OkEnvelope", OkEnvelopeSchema);
openapiRegistry.register("ErrorEnvelope", ErrorEnvelopeSchema);
openapiRegistry.register("BackendHealth", HealthBackendSchema);
openapiRegistry.register("LiveGamesResponse", LiveGamesSchema);
openapiRegistry.register("HrBoardTodayResponse", HrBoardTodaySchema);
openapiRegistry.register("AuthMeResponse", AuthMeSchema);
openapiRegistry.register("GradeParlayRequest", GradeParlaySchema);
openapiRegistry.register("SaveMeParlayRequest", SaveMeParlaySchema);
openapiRegistry.register("ListParlaysQuery", ListParlaysQuerySchema);
openapiRegistry.register("ParlayIdParams", ParlayIdParamsSchema);

openapiRegistry.registerPath({
  method: "get",
  path: "/api/health/backend",
  summary: "Backend ops health and production-readiness checklist",
  tags: ["Health"],
  responses: {
    200: {
      description: "Health report",
      content: { "application/json": { schema: HealthBackendSchema } },
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
      content: { "application/json": { schema: SaveMeParlaySchema } },
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
      content: { "application/json": { schema: GradeParlaySchema } },
    },
  },
  responses: {
    200: {
      description: "Graded legs",
      content: { "application/json": { schema: OkEnvelopeSchema } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/me/parlays",
  summary: "List authenticated user's saved parlays",
  tags: ["Parlays"],
  request: { query: ListParlaysQuerySchema },
  responses: {
    200: {
      description: "Parlay list",
      content: { "application/json": { schema: OkEnvelopeSchema } },
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
      description: "Grade run summary",
      content: { "application/json": { schema: OkEnvelopeSchema } },
    },
    401: {
      description: "Unauthorized cron",
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
      version: "0.2.0",
      description: "Phase 2 OpenAPI foundation — critical MLB, parlay, auth, and health routes.",
    },
    servers: [{ url: "/", description: "Current host" }],
  });
}
