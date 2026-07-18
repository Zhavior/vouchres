import { describe, expect, it } from "vitest";
import { CreatePickSchema } from "../server/validators/pickSchemas";

describe("CreatePickSchema judge_verdict hardening", () => {
  it("strips client-supplied judge_verdict so grading cannot be inverted", () => {
    const parsed = CreatePickSchema.parse({
      market: "hr",
      selection: "Aaron Judge",
      judge_verdict: "avoid",
    } as any);

    expect((parsed as { judge_verdict?: string }).judge_verdict).toBeUndefined();
  });
});
