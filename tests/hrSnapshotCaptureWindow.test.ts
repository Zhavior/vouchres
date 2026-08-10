import { describe, expect, it } from "vitest";
import {
  decideCapture,
  isPointInTime,
  NORMAL_WINDOW_MS,
  FALLBACK_WINDOW_MS,
} from "../server/services/hr-history/captureWindow";

const FIRST_PITCH = new Date("2026-08-10T23:10:00.000Z");

/** `minutes` before first pitch; negative means after. */
function at(minutes: number): Date {
  return new Date(FIRST_PITCH.getTime() - minutes * 60_000);
}

describe("decideCapture — post-first-pitch skip", () => {
  it("skips exactly at first pitch", () => {
    expect(decideCapture({ now: at(0), scheduledFirstPitch: FIRST_PITCH, alreadyCaptured: false }))
      .toEqual({ capture: false, reason: "first_pitch_passed" });
  });

  it("skips after first pitch", () => {
    expect(decideCapture({ now: at(-30), scheduledFirstPitch: FIRST_PITCH, alreadyCaptured: false }))
      .toEqual({ capture: false, reason: "first_pitch_passed" });
  });

  it("skips long after the game would be over — never retroactively captures", () => {
    expect(decideCapture({ now: at(-240), scheduledFirstPitch: FIRST_PITCH, alreadyCaptured: false }))
      .toEqual({ capture: false, reason: "first_pitch_passed" });
  });
});

describe("decideCapture — normal window", () => {
  it("captures at the outer edge of the window", () => {
    const now = new Date(FIRST_PITCH.getTime() - NORMAL_WINDOW_MS);
    expect(decideCapture({ now, scheduledFirstPitch: FIRST_PITCH, alreadyCaptured: false }))
      .toEqual({ capture: true, reason: "normal_window" });
  });

  it("captures mid-window", () => {
    expect(decideCapture({ now: at(20), scheduledFirstPitch: FIRST_PITCH, alreadyCaptured: false }))
      .toEqual({ capture: true, reason: "normal_window" });
  });

  it("is too early one millisecond outside the window", () => {
    const now = new Date(FIRST_PITCH.getTime() - NORMAL_WINDOW_MS - 1);
    expect(decideCapture({ now, scheduledFirstPitch: FIRST_PITCH, alreadyCaptured: false }))
      .toEqual({ capture: false, reason: "too_early" });
  });

  it("is too early hours ahead", () => {
    expect(decideCapture({ now: at(300), scheduledFirstPitch: FIRST_PITCH, alreadyCaptured: false }))
      .toEqual({ capture: false, reason: "too_early" });
  });
});

describe("decideCapture — T-5 fallback", () => {
  it("captures inside the fallback window", () => {
    expect(decideCapture({ now: at(3), scheduledFirstPitch: FIRST_PITCH, alreadyCaptured: false }))
      .toEqual({ capture: true, reason: "late_fallback" });
  });

  it("captures at the fallback boundary", () => {
    const now = new Date(FIRST_PITCH.getTime() - FALLBACK_WINDOW_MS);
    expect(decideCapture({ now, scheduledFirstPitch: FIRST_PITCH, alreadyCaptured: false }))
      .toEqual({ capture: true, reason: "late_fallback" });
  });

  it("still captures one second before first pitch — a projected snapshot beats none", () => {
    const now = new Date(FIRST_PITCH.getTime() - 1_000);
    expect(decideCapture({ now, scheduledFirstPitch: FIRST_PITCH, alreadyCaptured: false }))
      .toEqual({ capture: true, reason: "late_fallback" });
  });
});

describe("decideCapture — idempotency", () => {
  it("skips an already-captured game inside the normal window", () => {
    expect(decideCapture({ now: at(20), scheduledFirstPitch: FIRST_PITCH, alreadyCaptured: true }))
      .toEqual({ capture: false, reason: "already_captured" });
  });

  it("skips an already-captured game inside the fallback window", () => {
    expect(decideCapture({ now: at(2), scheduledFirstPitch: FIRST_PITCH, alreadyCaptured: true }))
      .toEqual({ capture: false, reason: "already_captured" });
  });

  it("already-captured outranks first-pitch-passed", () => {
    expect(decideCapture({ now: at(-10), scheduledFirstPitch: FIRST_PITCH, alreadyCaptured: true }))
      .toEqual({ capture: false, reason: "already_captured" });
  });
});

describe("decideCapture — forced dry run", () => {
  it("selects a future game that is far outside the normal window", () => {
    expect(
      decideCapture({
        now: at(300),
        scheduledFirstPitch: FIRST_PITCH,
        alreadyCaptured: false,
        forceDryRun: true,
      }),
    ).toEqual({ capture: true, reason: "forced_dry_run" });
  });

  it("selects a game just outside the normal window boundary", () => {
    const now = new Date(FIRST_PITCH.getTime() - NORMAL_WINDOW_MS - 1);
    expect(
      decideCapture({
        now,
        scheduledFirstPitch: FIRST_PITCH,
        alreadyCaptured: false,
        forceDryRun: true,
      }),
    ).toEqual({ capture: true, reason: "forced_dry_run" });
  });

  it("does NOT select a game at first pitch — force never bypasses that rule", () => {
    expect(
      decideCapture({
        now: at(0),
        scheduledFirstPitch: FIRST_PITCH,
        alreadyCaptured: false,
        forceDryRun: true,
      }),
    ).toEqual({ capture: false, reason: "first_pitch_passed" });
  });

  it("does NOT select a game after first pitch — a forced contaminated snapshot is worse than none", () => {
    expect(
      decideCapture({
        now: at(-45),
        scheduledFirstPitch: FIRST_PITCH,
        alreadyCaptured: false,
        forceDryRun: true,
      }),
    ).toEqual({ capture: false, reason: "first_pitch_passed" });
  });

  it("still respects already_captured", () => {
    expect(
      decideCapture({
        now: at(300),
        scheduledFirstPitch: FIRST_PITCH,
        alreadyCaptured: true,
        forceDryRun: true,
      }),
    ).toEqual({ capture: false, reason: "already_captured" });
  });

  it("leaves in-window behaviour unchanged when force is off", () => {
    expect(
      decideCapture({
        now: at(20),
        scheduledFirstPitch: FIRST_PITCH,
        alreadyCaptured: false,
        forceDryRun: false,
      }),
    ).toEqual({ capture: true, reason: "normal_window" });
  });

  it("defaults to unforced when the flag is omitted", () => {
    expect(decideCapture({ now: at(300), scheduledFirstPitch: FIRST_PITCH, alreadyCaptured: false }))
      .toEqual({ capture: false, reason: "too_early" });
  });
});

describe("isPointInTime", () => {
  it("is true before first pitch", () => {
    expect(isPointInTime(at(20), FIRST_PITCH)).toBe(true);
  });

  it("is false exactly at first pitch", () => {
    expect(isPointInTime(at(0), FIRST_PITCH)).toBe(false);
  });

  it("is false after first pitch", () => {
    expect(isPointInTime(at(-1), FIRST_PITCH)).toBe(false);
  });
});
