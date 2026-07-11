/** Server re-export of canonical ParlayOS state helpers (shared with client). */
export {
  type ParlayLockReason,
  type ParlayOsInput,
  type ParlayOsSnapshot,
  type ParlayOutcomeState,
  type ParlayProofState,
  type ParlayRecordState,
  inferLockReason,
  lockReasonLabel,
  normalizeLockReason,
  parlayLockedMessage,
  resolveParlayOsSnapshot,
  resolveParlayOutcomeState,
  resolveParlayProofState,
  resolveParlayRecordState,
} from "../../src/lib/parlayOsState";
