import type { ResolutionContract, ResolutionResult } from "./types";

export class ResolutionEngine {
  constructor(
    private readonly contract: ResolutionContract,
  ) {}

  resolve(result: "WIN" | "LOSS"): ResolutionResult {
    return {
      status: "RESOLVED",
      contractVersion: this.contract.version,
      resolvedAt: new Date().toISOString(),
      outcome: result,
    };
  }

  unresolved(reason: string): ResolutionResult {
    return {
      status: "UNRESOLVED",
      contractVersion: this.contract.version,
      resolvedAt: new Date().toISOString(),
      reason,
    };
  }

  void(reason: string): ResolutionResult {
    return {
      status: "VOID",
      contractVersion: this.contract.version,
      resolvedAt: new Date().toISOString(),
      reason,
    };
  }
}
