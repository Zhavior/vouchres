import { addBreadcrumb, captureMessage } from "../sentry";

export type CircuitState = "closed" | "open" | "half-open";

export class CircuitOpenError extends Error {
  readonly circuitName: string;

  constructor(circuitName: string, message = "Upstream circuit is open") {
    super(message);
    this.name = "CircuitOpenError";
    this.circuitName = circuitName;
  }
}

export type CircuitBreakerOptions = {
  name: string;
  failureThreshold?: number;
  windowMs?: number;
  cooldownMs?: number;
};

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureTimestamps: number[] = [];
  private openedAt: number | null = null;

  constructor(private readonly opts: Required<CircuitBreakerOptions>) {}

  getState(): CircuitState {
    return this.state;
  }

  canExecute(): boolean {
    if (this.state === "closed") return true;

    if (this.state === "open") {
      if (this.openedAt !== null && Date.now() - this.openedAt >= this.opts.cooldownMs) {
        this.state = "half-open";
        return true;
      }
      return false;
    }

    return true;
  }

  recordSuccess(): void {
    this.failureTimestamps = [];
    this.state = "closed";
    this.openedAt = null;
  }

  recordFailure(): void {
    const now = Date.now();
    this.failureTimestamps.push(now);
    this.failureTimestamps = this.failureTimestamps.filter(
      (timestamp) => now - timestamp <= this.opts.windowMs
    );

    if (this.failureTimestamps.length >= this.opts.failureThreshold) {
      if (this.state !== "open") {
        this.openCircuit(now);
      }
      return;
    }

    if (this.state === "half-open") {
      this.openCircuit(now);
    }
  }

  private openCircuit(now: number): void {
    this.state = "open";
    this.openedAt = now;

    const message = `[circuitBreaker] ${this.opts.name} opened after ${this.failureTimestamps.length} failures`;
    console.warn(message);

    addBreadcrumb({
      category: "circuit_breaker",
      message,
      level: "warning",
      data: {
        circuit: this.opts.name,
        failures: this.failureTimestamps.length,
        windowMs: this.opts.windowMs,
        cooldownMs: this.opts.cooldownMs,
      },
    });

    captureMessage(message, "warning");
  }
}

const DEFAULT_THRESHOLD = Number(process.env.MLB_CIRCUIT_FAILURE_THRESHOLD ?? 5);
const DEFAULT_WINDOW_MS = Number(process.env.MLB_CIRCUIT_WINDOW_MS ?? 60_000);
const DEFAULT_COOLDOWN_MS = Number(process.env.MLB_CIRCUIT_COOLDOWN_MS ?? 30_000);

let mlbStatsCircuitBreaker: CircuitBreaker | null = null;

export function getMlbStatsCircuitBreaker(): CircuitBreaker {
  if (!mlbStatsCircuitBreaker) {
    mlbStatsCircuitBreaker = new CircuitBreaker({
      name: "mlb_stats_api",
      failureThreshold: DEFAULT_THRESHOLD,
      windowMs: DEFAULT_WINDOW_MS,
      cooldownMs: DEFAULT_COOLDOWN_MS,
    });
  }
  return mlbStatsCircuitBreaker;
}

export function resetMlbStatsCircuitBreakerForTests(): void {
  mlbStatsCircuitBreaker = null;
}

export function isMlbStatsUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("statsapi.mlb.com") || host.endsWith("mlb.com");
  } catch {
    return /statsapi\.mlb\.com|mlb\.com\/api/i.test(url);
  }
}
