import { describe, expect, it, vi } from "vitest";
import { AppError } from "../server/errors/AppError";
import {
  assertParlayEdgeReportIsSafe,
  generateParlayEdgeReport,
} from "../server/services/ai/parlayEdgeReportService";
import { ParlayEdgeRequestSchema } from "../server/validators/aiSchemas";

const sampleLegs = [
  { selection: "Aaron Judge HR", market: "ANYTIME_HR", team: "NYY", gamePk: 745001 },
  { selection: "Giancarlo Stanton Hit", market: "HIT", team: "NYY", gamePk: 745001 },
];

describe("ParlayEdgeRequestSchema", () => {
  it("rejects missing legs and overlarge payloads", () => {
    expect(ParlayEdgeRequestSchema.safeParse({ legs: [] }).success).toBe(false);
    expect(ParlayEdgeRequestSchema.safeParse({ legs: Array.from({ length: 13 }, () => sampleLegs[0]) }).success).toBe(false);
  });

  it("requires useful leg identity text", () => {
    const parsed = ParlayEdgeRequestSchema.safeParse({
      legs: [{ selection: "", market: "HIT" }],
    });

    expect(parsed.success).toBe(false);
  });
});

describe("generateParlayEdgeReport", () => {
  it("returns a bounded local report without certainty language when no Gemini key is configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    const result = await generateParlayEdgeReport(ParlayEdgeRequestSchema.parse({ legs: sampleLegs }));

    expect(result.status).toBe("simulated");
    expect(result.edgeScore).toBeGreaterThanOrEqual(40);
    expect(result.edgeScore).toBeLessThanOrEqual(95);
    expect(result.riskLevel).toBe("MODERATE");
    expect(result.report).toContain("correlated");
    expect(() => assertParlayEdgeReportIsSafe(result.report)).not.toThrow();

    vi.unstubAllEnvs();
  });

  it("blocks unsafe certainty language before a response is sent", () => {
    expect(() => assertParlayEdgeReportIsSafe("This is a guaranteed lock.")).toThrow(AppError);
  });
});
