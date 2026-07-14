import { describe, expect, it } from "vitest";
import {
  AiLearningNoteSchema,
  FollowCreateSchema,
  NotificationPreferencesPatchSchema,
  PrivacyDeleteAccountSchema,
} from "../server/validators/mutationSchemas";

describe("mutation Zod schemas", () => {
  it("requires a single follow target", () => {
    expect(() => FollowCreateSchema.parse({})).toThrow();
    expect(() =>
      FollowCreateSchema.parse({
        following_profile_id: "11111111-1111-1111-1111-111111111111",
        following_capper_id: "22222222-2222-2222-2222-222222222222",
      }),
    ).toThrow();
    expect(
      FollowCreateSchema.parse({
        following_profile_id: "11111111-1111-1111-1111-111111111111",
      }).relationship_type,
    ).toBe("follow");
  });

  it("accepts boolean notification preference patches only", () => {
    expect(
      NotificationPreferencesPatchSchema.parse({ hr_alerts_enabled: true }),
    ).toEqual({ hr_alerts_enabled: true });
    expect(() => NotificationPreferencesPatchSchema.parse({ hr_alerts_enabled: "yes" })).toThrow();
  });

  it("requires exact privacy deletion confirmation phrase", () => {
    expect(() => PrivacyDeleteAccountSchema.parse({ confirm: "delete" })).toThrow();
    expect(PrivacyDeleteAccountSchema.parse({ confirm: "DELETE MY ACCOUNT" }).confirm).toBe(
      "DELETE MY ACCOUNT",
    );
  });

  it("requires pickId + result for learning notes", () => {
    expect(() => AiLearningNoteSchema.parse({ pickId: "p1" })).toThrow();
    expect(() => AiLearningNoteSchema.parse({ pickId: "p1", result: "won" })).toThrow();
    expect(AiLearningNoteSchema.parse({ pickId: "p1", result: "win" }).originalLogic).toBe("");
  });
});
