import { describe, expect, it } from "vitest";
import { formatMlbStatus, isMlbFinalStatusText, isMlbLiveStatus } from "../server/services/mlb/gameStatus";

describe("MLB game status classification", () => {
  it("treats common in-game MLB status labels as live", () => {
    expect(isMlbLiveStatus("In Progress")).toBe(true);
    expect(isMlbLiveStatus("Top 3rd")).toBe(true);
    expect(isMlbLiveStatus("Bottom 7th")).toBe(true);
    expect(isMlbLiveStatus("Middle 5th")).toBe(true);
    expect(isMlbLiveStatus("End 8th")).toBe(true);
    expect(isMlbLiveStatus("Player challenge")).toBe(true);
    expect(isMlbLiveStatus("Replay Review")).toBe(true);
  });

  it("does not treat scheduled or final games as live", () => {
    expect(isMlbLiveStatus("Scheduled")).toBe(false);
    expect(isMlbLiveStatus("Pre-Game")).toBe(false);
    expect(isMlbLiveStatus("Final")).toBe(false);
  });

  it("detects final statuses separately", () => {
    expect(isMlbFinalStatusText("Final")).toBe(true);
    expect(isMlbFinalStatusText("Game Over")).toBe(true);
    expect(isMlbFinalStatusText("Completed Early")).toBe(true);
    expect(isMlbFinalStatusText("Top 9th")).toBe(false);
  });

  it("classifies MLB status objects for grading and route code", () => {
    expect(isMlbFinalStatusText({ abstractGameState: "Final", detailedState: "Final", codedGameState: "F" })).toBe(true);
    expect(isMlbFinalStatusText({ abstractGameState: "Live", detailedState: "In Progress", codedGameState: "I" })).toBe(false);
    expect(isMlbLiveStatus({ abstractGameState: "Live", detailedState: "Warmup", codedGameState: "PW" })).toBe(true);
    expect(formatMlbStatus({ abstractGameState: "Live", detailedState: "Warmup", codedGameState: "PW", statusCode: "PW" }))
      .toBe("abstract=Live, detailed=Warmup, coded=PW, statusCode=PW");
  });
});
