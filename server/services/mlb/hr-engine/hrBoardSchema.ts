import { z } from "zod";

export const HrBoardUnknownRecordSchema = z.record(z.string(), z.unknown());

export const HrBoardDebugSchema = z
  .object({
    eligiblePreviewPoolCount: z.number().optional(),
    scoredPreviewPoolCount: z.number().optional(),
    blockedPlayers: z.array(HrBoardUnknownRecordSchema).optional(),
    blockedReasons: z.record(z.string(), z.unknown()).optional(),
  })
  .catchall(z.unknown());

export const HrBoardPoolSchema = z
  .object({
    totalPlayersChecked: z.number().optional().default(0),
    confirmedStarters: z.number().optional().default(0),
    projectedStarters: z.number().optional().default(0),
    benchOrUnknown: z.number().optional().default(0),
    injuredScratchedBlocked: z.number().optional().default(0),
    hrCandidatesScored: z.number().optional().default(0),
  })
  .catchall(z.unknown());

export const HrBoardResultSchema = z
  .object({
    date: z.string().optional(),
    gameCount: z.number().optional().default(0),
    disclaimer: z.string().optional(),
    rosterAudit: z.unknown().optional(),
    candidates: z.array(HrBoardUnknownRecordSchema).optional().default([]),
    projectedCandidates: z.array(HrBoardUnknownRecordSchema).optional().default([]),
    debug: HrBoardDebugSchema.optional().default({}),
    pool: HrBoardPoolSchema.optional().default({
      totalPlayersChecked: 0,
      confirmedStarters: 0,
      projectedStarters: 0,
      benchOrUnknown: 0,
      injuredScratchedBlocked: 0,
      hrCandidatesScored: 0,
    }),
  })
  .catchall(z.unknown());

export type HrBoardResultInput = z.infer<typeof HrBoardResultSchema>;

export function parseHrBoardResult(input: unknown): HrBoardResultInput {
  const parsed = HrBoardResultSchema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    gameCount: 0,
    disclaimer:
      "HR Watch payload failed validation. Showing unavailable state instead of unsafe partial data.",
    rosterAudit: undefined,
    candidates: [],
    projectedCandidates: [],
    debug: {
      validationFailed: true,
      validationIssues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
    pool: {
      totalPlayersChecked: 0,
      confirmedStarters: 0,
      projectedStarters: 0,
      benchOrUnknown: 0,
      injuredScratchedBlocked: 0,
      hrCandidatesScored: 0,
    },
  };
}
