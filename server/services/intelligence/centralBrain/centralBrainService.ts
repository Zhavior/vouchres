import type {
  CentralBrainAdapter,
  CentralBrainNarrator,
  CentralBrainSnapshot,
  CentralBrainSport,
} from "./contracts";
import { mlbCentralBrainAdapter, type MlbCentralBrainInput } from "./mlbAdapter";
import { CentralBrainSnapshotSchema } from "./schemas";

const adapters = new Map<CentralBrainSport, CentralBrainAdapter<any>>([
  [mlbCentralBrainAdapter.sport, mlbCentralBrainAdapter],
]);

export function listCentralBrainSports() {
  return (["mlb", "nba", "nfl", "nhl"] as const).map((sport) => ({
    sport,
    available: adapters.has(sport),
    engineVersion: adapters.get(sport)?.engineVersion ?? null,
  }));
}

export class CentralBrainAgent {
  readonly id = "vouchedge-central-brain" as const;

  constructor(
    private readonly narrator?: CentralBrainNarrator,
    private readonly adapterRegistry: Map<CentralBrainSport, CentralBrainAdapter<any>> = adapters,
  ) {}

  async run<TInput>(sport: CentralBrainSport, input: TInput): Promise<CentralBrainSnapshot> {
    const adapter = this.adapterRegistry.get(sport);
    if (!adapter) {
      throw new Error(`Central brain adapter unavailable for sport: ${sport}`);
    }

    const built = await adapter.build(input);
    const snapshot = CentralBrainSnapshotSchema.parse({
      schemaVersion: "1.0",
      engineVersion: adapter.engineVersion,
      sport,
      ...built,
    });

    if (!this.narrator) return snapshot;

    const summary = await this.narrator(Object.freeze(snapshot));
    if (!summary) return snapshot;

    return CentralBrainSnapshotSchema.parse({
      ...snapshot,
      agent: {
        id: this.id,
        role: "explanation_only",
        summary,
      },
    });
  }
}

const centralBrainAgent = new CentralBrainAgent();

export function getDailyMlbCentralBrain(date?: string) {
  return centralBrainAgent.run<MlbCentralBrainInput>("mlb", { date });
}
