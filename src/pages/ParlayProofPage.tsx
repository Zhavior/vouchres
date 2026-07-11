import React, { useMemo } from "react";
import { ExternalLink, ShieldCheck, Lock, Download, Layers3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SmartParlaySlipCard from "../components/parlay/smart/SmartParlaySlipCard";
import ParlayOsBadgeRow from "../components/trust/ParlayOsBadgeRow";
import ParlayIdentityBadge from "../components/trust/ParlayIdentityBadge";
import { formatFeedLockTimestamp } from "../lib/parlayLockPolicy";
import { fetchParlayProofRecord } from "../lib/parlays/fetchParlayProof";
import type { ClientParlayProof } from "../lib/parlays/parlayProofClient";
import { isBackendProofPickId } from "../lib/parlays/parlayProofLinks";
import { projectSmartParlayFromProof } from "../domain/parlay";

function scopeLabel(proof: ClientParlayProof): string {
  if (proof.proofScope === "public") return "Public proof record";
  if (proof.proofScope === "owner") return "Account proof record";
  return "Local slip record";
}

export default function ParlayProofPage({ pickId }: { pickId: string }) {
  const { data: proof, isLoading, error } = useQuery({
    queryKey: ["parlay-proof", pickId],
    queryFn: () => fetchParlayProofRecord(pickId),
    staleTime: 60_000,
  });

  const smartSlip = useMemo(
    () => (proof ? projectSmartParlayFromProof(proof) : null),
    [proof],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-obsidian)] text-white flex items-center justify-center p-8">
        <p className="font-mono text-sm text-cyan-300/80 animate-pulse">Loading parlay proof…</p>
      </div>
    );
  }

  if (error || !proof || !smartSlip) {
    return (
      <div className="min-h-screen bg-[var(--bg-obsidian)] text-white flex flex-col items-center justify-center gap-4 p-8">
        <ShieldCheck className="w-10 h-10 text-amber-400/70" />
        <h1 className="text-lg font-black">Proof not available</h1>
        <p className="text-sm text-white/50 text-center max-w-md">
          This parlay has no public proof yet. Saved practice slips stay on your device until you sign in and lock to ledger.
        </p>
        <a href="/live_parlays" className="text-cyan-300 font-bold text-sm hover:underline">Back to Live &amp; Pending</a>
      </div>
    );
  }

  const author = proof.author?.display_name ?? proof.author?.handle ?? proof.author?.username ?? "VouchEdge";
  const lockLabel = proof.locked_at ? formatFeedLockTimestamp(proof.locked_at) : null;
  const publicProofUrl = proof.proofScope === "public" && isBackendProofPickId(proof.id)
    ? `/p/${encodeURIComponent(proof.id)}`
    : null;
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
            {smartSlip.title}
          </h1>
          <p className="text-sm text-white/45">
            {proof.proofScope === "local" ? scopeLabel(proof) : `by ${author}`} · {new Date(proof.created_at).toLocaleString()}
            {lockLabel ? ` · Locked ${lockLabel}` : ""}
          </p>
          {proof.proofNote ? (
            <p className="text-xs text-amber-200/85 rounded-xl border border-amber-500/25 bg-amber-950/20 px-3 py-2.5 leading-snug">
              {proof.proofNote}
            </p>
          ) : null}
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
          <ParlayIdentityBadge identity={smartSlip.identity} />
        </header>

        {proof.proof_hash ? (
          <section className="rounded-2xl border border-cyan-500/25 bg-cyan-950/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/70 mb-2">Proof hash (SHA-256)</p>
            <p className="font-mono text-[11px] text-cyan-100/90 break-all">{proof.proof_hash}</p>
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-white/40">Legs</h2>
          <SmartParlaySlipCard
            slip={smartSlip}
            variant="embedded"
            legVariant="pro"
            maxLegs={99}
            showTrustPanel={false}
            showIdentityBadge={false}
          />
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
          {publicProofUrl ? (
            <a
              href={publicProofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white/70 hover:border-cyan-400/40 hover:text-cyan-200"
            >
              <ExternalLink className="w-4 h-4" />
              Public proof link
            </a>
          ) : null}
          <a
            href="/live_parlays"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white/70 hover:border-cyan-400/40 hover:text-cyan-200"
          >
            <ExternalLink className="w-4 h-4" />
            Back to Live &amp; Pending
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
