/**
 * Canonical feature hashing (HR-M1).
 *
 * Two snapshots of the same pregame state must hash identically regardless of
 * key insertion order, and must diverge the moment any captured value or
 * version changes. That property is what makes a stored snapshot replayable:
 * given the hash you can prove a later recomputation saw the same inputs.
 *
 * Undefined values are dropped rather than encoded, so an absent optional field
 * and a field explicitly set to undefined hash the same — they mean the same
 * thing. `null` is preserved, because "we looked and there was nothing" is a
 * different fact from "we never looked".
 */

import { createHash } from "node:crypto";

/** Deterministic JSON: object keys sorted, arrays order-preserving. */
function canonicalize(value: unknown): unknown {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(canonicalize);

  if (typeof value === "object") {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) continue;
      out[key] = canonicalize(entry);
    }
    return out;
  }

  // Number/string/boolean pass through. NaN and Infinity are not
  // representable in JSON and would silently become null, so they are
  // rejected rather than hashed into an indistinguishable value.
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error(`featureHash: non-finite number cannot be hashed (${String(value)})`);
  }
  return value;
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export interface FeatureHashVersions {
  featureSetVersion: string;
  pipelineVersion: string;
}

/**
 * Hash of the captured payload plus the versions that produced it. A pipeline
 * change that alters no value still changes the hash, which is intended —
 * identical inputs computed by different code are not the same observation.
 */
export function featureHash(
  features: Record<string, unknown>,
  versions: FeatureHashVersions,
): string {
  const payload = canonicalStringify({
    features,
    featureSetVersion: versions.featureSetVersion,
    pipelineVersion: versions.pipelineVersion,
  });
  return createHash("sha256").update(payload).digest("hex");
}
