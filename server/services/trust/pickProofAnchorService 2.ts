import { getSupabaseAdmin } from "../../middleware/auth";
import { stampSha256ProofHash } from "./openTimestampService";

export async function updatePickOtsProof(input: {
  pickId: string;
  proofBase64: string;
  stampedAt: string;
}): Promise<void> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("picks")
    .update({
      ots_proof: input.proofBase64,
      ots_stamped_at: input.stampedAt,
    })
    .eq("id", input.pickId);

  if (error && error.code !== "42703" && error.code !== "PGRST204") {
    throw error;
  }
}

export async function anchorParlayProofOpenTimestamp(input: {
  pickId: string;
  proofHash: string;
}): Promise<{ anchored: boolean; stampedAt?: string }> {
  const stamp = await stampSha256ProofHash(input.proofHash);
  if (!stamp) {
    return { anchored: false };
  }

  await updatePickOtsProof({
    pickId: input.pickId,
    proofBase64: stamp.proofBase64,
    stampedAt: stamp.stampedAt,
  });

  return { anchored: true, stampedAt: stamp.stampedAt };
}

export async function backfillOpenTimestampsForLockedPicks(options: {
  limit?: number;
} = {}): Promise<{ scanned: number; anchored: number; skipped: number }> {
  const limit = Math.min(Math.max(Number(options.limit ?? 25), 1), 100);
  const supabaseAdmin = await getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("picks")
    .select("id, proof_hash, locked_at, ots_proof")
    .not("locked_at", "is", null)
    .not("proof_hash", "is", null)
    .is("ots_proof", null)
    .order("locked_at", { ascending: true })
    .limit(limit);

  if (error) {
    if (error.code === "42703" || error.code === "PGRST204") {
      return { scanned: 0, anchored: 0, skipped: 0 };
    }
    throw error;
  }

  let anchored = 0;
  let skipped = 0;

  for (const row of data ?? []) {
    const proofHash = String(row.proof_hash ?? "").trim();
    if (!proofHash) {
      skipped += 1;
      continue;
    }

    const result = await anchorParlayProofOpenTimestamp({
      pickId: String(row.id),
      proofHash,
    });

    if (result.anchored) {
      anchored += 1;
    } else {
      skipped += 1;
    }
  }

  return {
    scanned: data?.length ?? 0,
    anchored,
    skipped,
  };
}
