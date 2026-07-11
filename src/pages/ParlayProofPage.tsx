import React, { useMemo } from "react";
import { ExternalLink, ShieldCheck, Lock, Download, Layers3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import ParlayLegCardPro from "../components/parlay/os/ParlayLegCardPro";
import ParlayOsBadgeRow from "../components/trust/ParlayOsBadgeRow";
import ParlayIdentityBadge from "../components/trust/ParlayIdentityBadge";
import { assessClientParlayIdentity } from "../lib/parlayIdentity";
import { formatFeedLockTimestamp } from "../lib/parlayLockPolicy";
import type { Leg } from "../types";

type PublicParlayProof = {
  id: string;
  sport: string;
  selection: string;
  explanation?: string | null;
  odds_decimal?: number | null;
  status: string;
  created_at: string;
  locked_at?: string | null;
  proof_hash?: string | null;
  ots_stamped_at?: string | null;
  has_ots_proof?: boolean;
  lock_reason?: string | null;
  committed_at?: string | null;
  legs: Array<Record<string, unknown>>;
  author?: { display_name?: string; handle?: string; username?: string } | null;
  trust_events?: Array<{ label: string; created_at: string }>;
  proof_url?: string;
};

function mapProofLeg(leg: Record<string, unknown>, index: number): Leg {
  return {
    id: String(leg.id ?? `leg-${index}`),
    sport: String(leg.sport ?? "MLB"),
    game: String(leg.game_label ?? leg.game ?? ""),
    market: String(leg.market_label ?? leg.market ?? "Prop"),
    selection: String(leg.selection ?? leg.player_name ?? "Prop"),
    odds: leg.odds_decimal != null ? Number(leg.odds_decimal) : null,
    status: String(leg.status ?? "PENDING").toUpperCase() as Leg["status"],
    gamePk: leg.game_id != null ? String(leg.game_id) : leg.game_pk != null ? String(leg.game_pk) : undefined,
    playerId: leg.player_id != null ? String(leg.player_id) : undefined,
    marketCode: leg.market_code != null ? String(leg.market_code) : undefined,
    statTarget: leg.stat_target != null ? Number(leg.stat_target) : undefined,
    comparator: leg.comparator != null ? String(leg.comparator) : undefined,
    actual: leg.actual_value != null ? Number(leg.actual_value) : null,
  };
}

export default function ParlayProofPage({ pickId }: { pickId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["parlay-proof", pickId],
    queryFn: () => apiClient.get<{ proof: PublicParlayProof }>(`/api/proof/parlay/${encodeURIComponent(pickId)}`),
    staleTime: 60_000,
  });

  const proof = data?.proof;
  const uiLegs = useMemo(
    () => (proof?.legs ?? []).map((leg, index) => mapProofLeg(leg, index)),
    [proof?.legs],
  );
  const identity = useMemo(
    () => assessClientParlayIdentity((proof?.legs ?? []) as Record<string, unknown>[]),
    [proof?.legs],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-obsidian)] text-white flex items-center justify-center p-8">
        <p className="font-mono text-sm text-cyan-300/80 animate-pulse">Loading parlay proof…</p>
      </div>
    );
  }

  if (error || !proof) {
    return (
      <div className="min-h-screen bg-[var(--bg-obsidian)] text-white flex flex-col items-center justify-center gap-4 p-8">
        <ShieldCheck className="w-10 h-10 text-amber-400/70" />
        <h1 className="text-lg font-black">Proof not available</h1>
        <p className="text-sm text-white/50 text-center max-w-md">
          This parlay is private, was removed, or the link is invalid.
        </p>
        <a href="/" className="text-cyan-300 font-bold text-sm hover:underline">Open VouchEdge</a>
      </div>
    );
  }

  const author = proof.author?.display_name ?? proof.author?.handle ?? proof.author?.username ?? "VouchEdge";
  const lockLabel = proof.locked_at ? formatFeedLockTimestamp(proof.locked_at) : null;
  const otsUrl = proof.has_ots_proof ? `/api/proof/parlay/${encodeURIComponent(proof.id)}/ots` : null;

  return (
    <div className="min-h-screen bg-[var(--bg-obsidian)] text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Layers3 className="w-5 h-5" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em]">ParlayOS Proof</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">
            {proof.explanation || proof.selection || `${uiLegs.length}-leg parlay`}
          </h1>
          <p className="text-sm text-white/45">
            by {author} · {new Date(proof.created_at).toLocaleString()}
            {lockLabel ? ` · Locked ${lockLabel}` : ""}
          </p>
          <ParlayOsBadgeRow
            input={{
              id: proof.id,
              status: proof.status,
              committedAt: proof.committed_at ?? undefined,
              feedLockedAt: proof.locked_at ?? undefined,
              lockReason: proof.lock_reason ?? undefined,
              proofHash: proof.proof_hash ?? undefined,
              otsStampedAt: proof.ots_stamped_at ?? undefined,
            }}
          />
          <ParlayIdentityBadge identity={identity} />
        </header>

        {proof.proof_hash ? (
          <section className="rounded-2xl border border-cyan-500/25 bg-cyan-950/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/70 mb-2">Proof hash (SHA-256)</p>
            <p className="font-mono text-[11px] text-cyan-100/90 break-all">{proof.proof_hash}</p>
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-white/40">Legs</h2>
          {uiLegs.map((leg) => (
            <ParlayLegCardPro key={leg.id} leg={leg} compact />
          ))}
        </section>

        {proof.trust_events && proof.trust_events.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-white/40">Trust timeline</h2>
            <ul className="space-y-2">
              {proof.trust_events.map((event, index) => (
                <li key={`${event.label}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                  <span className="font-semibold text-white/85">{event.label}</span>
                  <span className="text-white/40 text-xs ml-2">{new Date(event.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
          {otsUrl ? (
            <a
              href={otsUrl}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-cyan-200"
            >
              <Download className="w-4 h-4" />
              Download OTS proof
            </a>
          ) : null}
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white/70 hover:border-cyan-400/40 hover:text-cyan-200"
          >
            <ExternalLink className="w-4 h-4" />
            Open VouchEdge
          </a>
          {proof.locked_at ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-300/80 font-mono ml-auto">
              <Lock className="w-3.5 h-3.5" />
              Sealed for grading truth
            </span>
          ) : null}
        </footer>

        <p className="text-[10px] text-white/30 text-center pb-8">
          Probability-based research record. No guarantees. Entertainment only.
        </p>
      </div>
    </div>
  );
}
