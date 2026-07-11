import { getSupabaseAdmin } from "../../middleware/auth";
import {
  findLegsForPick,
  findPublicParlayById,
  updatePickProofHash,
  type ParlayLegRow,
  type ParlayRow,
} from "../../repositories/parlayRepository";
import { computeParlayProofHash } from "../../lib/parlayProofHash";
import { listPublicTrustEventsForPick, type PublicTrustEvent } from "../trust/publicPickAuditService";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PublicParlayAuthor {
  id: string;
  handle: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface PublicParlayProof {
  id: string;
  user_id: string | null;
  capper_id: string | null;
  sport: string;
  market: string;
  selection: string;
  odds_decimal: number | null;
  stake_units: number | null;
  status: string;
  explanation: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  locked_at: string | null;
  proof_hash: string | null;
  ots_stamped_at: string | null;
  has_ots_proof: boolean;
  lock_reason?: string | null;
  committed_at?: string | null;
  legs: ParlayLegRow[];
  author: PublicParlayAuthor | null;
  capper: { id: string; display_name: string } | null;
  proof_url: string;
  trust_events: PublicTrustEvent[];
}

async function loadProfileAuthor(userId: string): Promise<PublicParlayAuthor | null> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, handle, username, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PublicParlayAuthor;
}

async function loadCapperAuthor(capperId: string): Promise<{ id: string; display_name: string } | null> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("cappers")
    .select("id, display_name")
    .eq("id", capperId)
    .maybeSingle();

  if (error || !data) return null;
  return data as { id: string; display_name: string };
}

export async function getPublicParlayProof(id: string, baseUrl?: string): Promise<PublicParlayProof | null> {
  if (!UUID_RE.test(id)) return null;

  const parlay = await findPublicParlayById(id);
  if (!parlay) return null;

  const legs = await findLegsForPick(id);
  const userId = parlay.user_id ? String(parlay.user_id) : null;
  const capperId = parlay.capper_id ? String(parlay.capper_id) : null;

  let proofHash = parlay.proof_hash ? String(parlay.proof_hash) : null;
  if (!proofHash && parlay.locked_at) {
    proofHash = computeParlayProofHash({
      id: String(parlay.id),
      created_at: parlay.created_at,
      locked_at: parlay.locked_at,
      odds_decimal: parlay.odds_decimal,
      stake_units: parlay.stake_units,
      legs,
    });
    await updatePickProofHash(id, proofHash).catch(() => undefined);
  }

  const [author, capper, trustEvents] = await Promise.all([
    userId ? loadProfileAuthor(userId) : Promise.resolve(null),
    capperId ? loadCapperAuthor(capperId) : Promise.resolve(null),
    listPublicTrustEventsForPick(id),
  ]);

  const host = baseUrl?.replace(/\/$/, "") ?? "";
  return {
    id: String(parlay.id),
    user_id: userId,
    capper_id: capperId,
    sport: String(parlay.sport ?? "mlb"),
    market: String(parlay.market ?? ""),
    selection: String(parlay.selection ?? ""),
    odds_decimal: parlay.odds_decimal != null ? Number(parlay.odds_decimal) : null,
    stake_units: parlay.stake_units != null ? Number(parlay.stake_units) : null,
    status: String(parlay.status ?? "pending"),
    explanation: parlay.explanation ?? null,
    source: parlay.source ?? null,
    created_at: String(parlay.created_at),
    updated_at: String(parlay.updated_at ?? parlay.created_at),
    locked_at: parlay.locked_at ? String(parlay.locked_at) : null,
    proof_hash: proofHash,
    ots_stamped_at: parlay.ots_stamped_at ? String(parlay.ots_stamped_at) : null,
    has_ots_proof: Boolean(parlay.ots_proof),
    lock_reason: parlay.lock_reason ? String(parlay.lock_reason) : null,
    committed_at: parlay.committed_at ? String(parlay.committed_at) : null,
    legs,
    author,
    capper,
    proof_url: host ? `${host}/p/${encodeURIComponent(id)}` : `/p/${encodeURIComponent(id)}`,
    trust_events: trustEvents,
  };
}

export function formatProofTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function parlayProofAuthorLabel(proof: PublicParlayProof): string {
  if (proof.author?.handle) return `@${proof.author.handle}`;
  if (proof.author?.username) return `@${proof.author.username}`;
  if (proof.capper?.display_name) return proof.capper.display_name;
  return "VouchEdge creator";
}
