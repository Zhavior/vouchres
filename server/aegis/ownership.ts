export type AegisOwnershipRecord = {
  capability: string;
  domain: string;
  canonicalOperation: string;
  canonicalHandler: string;
  approvedEntryPoints: readonly string[];
  deprecatedEntryPoints: readonly string[];
  emittedEvents: readonly string[];
  affectedTables: readonly string[];
};

export const AEGIS_OWNERSHIP: readonly AegisOwnershipRecord[] = [
  {
    capability: "parlay.save",
    domain: "parlay",
    canonicalOperation: "SaveParlayCommand@1",
    canonicalHandler: "server/services/parlays/parlayCreationService.saveUserParlay",
    approvedEntryPoints: ["POST /api/v3/parlays/save", "POST /api/me/parlays"],
    deprecatedEntryPoints: ["POST /api/parlays"],
    emittedEvents: [],
    affectedTables: ["public.picks", "public.pick_legs"],
  },
  {
    capability: "parlay.commit_trust",
    domain: "parlay",
    canonicalOperation: "CommitParlayTrustCommand@1",
    canonicalHandler: "server/services/parlays/userParlayService.commitParlayTrustLedger",
    approvedEntryPoints: ["POST /api/v3/parlays/:id/commit-trust"],
    deprecatedEntryPoints: ["legacy compatibility adapter"],
    emittedEvents: [],
    affectedTables: ["public.picks", "public.pick_audit_log", "public.trust_ledger"],
  },
  {
    capability: "parlay.finalize_trust_lock",
    domain: "trust",
    canonicalOperation: "FinalizeParlayTrustLockCommand@1",
    canonicalHandler: "server/services/parlays/userParlayService.finalizeParlayTrustLock",
    approvedEntryPoints: ["POST /api/v3/parlays/:id/finalize-trust-lock", "trust-lock worker"],
    deprecatedEntryPoints: ["legacy compatibility adapter"],
    emittedEvents: [],
    affectedTables: ["public.picks", "public.pick_audit_log", "public.trust_ledger"],
  },
  {
    capability: "parlay.resolve",
    domain: "resolution",
    canonicalOperation: "GradeDueParlaysCommand (planned Aegis adapter)",
    canonicalHandler: "server/services/grading/gradingService.gradePendingPicks",
    approvedEntryPoints: ["POST /api/v3/grading/grade-due", "grading cron"],
    deprecatedEntryPoints: ["legacy grading routes during cutover"],
    emittedEvents: ["PickResolutionRecorded", "ParlayFinalized"],
    affectedTables: ["public.pick_legs", "public.picks", "public.parlay_settlement_audit"],
  },
  {
    capability: "parlay.proof",
    domain: "trust",
    canonicalOperation: "GenerateParlayProofCommand (planned durable worker)",
    canonicalHandler: "server/services/trust/pickProofAnchorService.anchorParlayProofOpenTimestamp",
    approvedEntryPoints: ["trust lock finalization", "GET /api/proof/parlay/:id"],
    deprecatedEntryPoints: [],
    emittedEvents: ["ProofGenerated", "ProofPublished"],
    affectedTables: ["public.picks", "public.pick_proof_anchors"],
  },
] as const;
