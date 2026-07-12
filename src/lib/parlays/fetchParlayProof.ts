import { apiClient } from "../apiClient";
import { isBackendProofPickId } from "./parlayProofLinks";
import {
  buildLocalParlayProof,
  mapOwnedParlayToProof,
  type ClientParlayProof,
} from "./parlayProofClient";
import { useSlipsStore } from "../../stores/slipsStore";
import type { Parlay } from "../../types";

async function fetchPublicProof(pickId: string): Promise<ClientParlayProof | null> {
  try {
    const result = await apiClient.get<{ proof: ClientParlayProof }>(
      `/api/proof/parlay/${encodeURIComponent(pickId)}`,
    );
    if (result?.proof) {
      return { ...result.proof, proofScope: "public" };
    }
  } catch {
    // fall through to owner/local lookup
  }
  return null;
}

async function fetchOwnedProof(pickId: string): Promise<ClientParlayProof | null> {
  try {
    const result = await apiClient.get<{ parlay: Record<string, unknown> }>(
      `/api/parlays/${encodeURIComponent(pickId)}`,
    );
    if (result?.parlay) return mapOwnedParlayToProof(result.parlay);
  } catch {
    return null;
  }
  return null;
}

function findLocalSlip(pickId: string): Parlay | undefined {
  return useSlipsStore.getState().savedSlips.find(
    (slip) => slip.id === pickId || slip.backendPickId === pickId,
  );
}

export async function fetchParlayProofRecord(pickId: string): Promise<ClientParlayProof | null> {
  const trimmed = String(pickId ?? "").trim();
  if (!trimmed) return null;

  if (isBackendProofPickId(trimmed)) {
    const publicProof = await fetchPublicProof(trimmed);
    if (publicProof) return publicProof;

    const ownedProof = await fetchOwnedProof(trimmed);
    if (ownedProof) return ownedProof;
  }

  const localSlip = findLocalSlip(trimmed);
  if (localSlip) return buildLocalParlayProof(localSlip);

  return null;
}
