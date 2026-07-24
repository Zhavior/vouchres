import { describe, expect, it } from "vitest";
import { deriveParentStatusFromLegs } from "../server/services/grading/liveHrParlayWriteService";

describe("deriveParentStatusFromLegs", () => {
  it("requires every leg to be a known terminal status before settling", () => {
    expect(deriveParentStatusFromLegs([{ status: "won" }, { status: "pending" }])).toBeNull();
    expect(deriveParentStatusFromLegs([{ status: "won" }, { status: "" }])).toBeNull();
    expect(deriveParentStatusFromLegs([{ status: "won" }, { status: "unknown" }])).toBeNull();
    expect(deriveParentStatusFromLegs([{ status: "won" }, { status: null }])).toBeNull();
  });

  it("settles lost/push/void/won only from terminal legs", () => {
    expect(deriveParentStatusFromLegs([{ status: "won" }, { status: "lost" }])).toBe("lost");
    expect(deriveParentStatusFromLegs([{ status: "push" }, { status: "push" }])).toBe("push");
    expect(deriveParentStatusFromLegs([{ status: "void" }, { status: "void" }])).toBe("void");
    expect(deriveParentStatusFromLegs([{ status: "won" }, { status: "push" }])).toBe("won");
    expect(deriveParentStatusFromLegs([{ status: "won" }, { status: "won" }])).toBe("won");
  });
});
