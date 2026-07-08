import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CircuitBreaker,
  CircuitOpenError,
  resetMlbStatsCircuitBreakerForTests,
} from "../server/lib/sports/circuitBreaker";

vi.mock("../server/lib/sentry", () => ({
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

describe("circuit breaker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetMlbStatsCircuitBreakerForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    resetMlbStatsCircuitBreakerForTests();
  });

  it("opens after N failures in the window and blocks until cooldown", () => {
    const breaker = new CircuitBreaker({
      name: "test",
      failureThreshold: 3,
      windowMs: 10_000,
      cooldownMs: 5_000,
    });

    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.getState()).toBe("closed");
    expect(breaker.canExecute()).toBe(true);

    breaker.recordFailure();
    expect(breaker.getState()).toBe("open");
    expect(breaker.canExecute()).toBe(false);

    vi.advanceTimersByTime(4_999);
    expect(breaker.canExecute()).toBe(false);

    vi.advanceTimersByTime(2);
    expect(breaker.canExecute()).toBe(true);
    expect(breaker.getState()).toBe("half-open");
  });

  it("closes again after a successful half-open probe", () => {
    const breaker = new CircuitBreaker({
      name: "test",
      failureThreshold: 2,
      windowMs: 10_000,
      cooldownMs: 1_000,
    });

    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.getState()).toBe("open");

    vi.advanceTimersByTime(1_000);
    expect(breaker.canExecute()).toBe(true);
    breaker.recordSuccess();

    expect(breaker.getState()).toBe("closed");
    expect(breaker.canExecute()).toBe(true);
  });

  it("reopens when a half-open probe fails", () => {
    const breaker = new CircuitBreaker({
      name: "test",
      failureThreshold: 2,
      windowMs: 10_000,
      cooldownMs: 1_000,
    });

    breaker.recordFailure();
    breaker.recordFailure();
    vi.advanceTimersByTime(1_000);

    expect(breaker.canExecute()).toBe(true);
    breaker.recordFailure();
    expect(breaker.getState()).toBe("open");
    expect(breaker.canExecute()).toBe(false);
  });

  it("exposes CircuitOpenError for callers", () => {
    const err = new CircuitOpenError("mlb_stats_api");
    expect(err).toBeInstanceOf(Error);
    expect(err.circuitName).toBe("mlb_stats_api");
  });
});
