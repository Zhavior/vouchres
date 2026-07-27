import { useEffect, useState } from "react";
import { Check, Lock, X } from "lucide-react";
import type { TrustAudience } from "../../lib/trustLockSchedule";
import { TRUST_LOCK_MINUTES, TRUST_LOCK_WARN_MINUTES } from "../../lib/trustLockSchedule";

export type ParlayTrustLockModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (audience: TrustAudience) => void;
  isSubmitting?: boolean;
  canUseSubscriber?: boolean;
};

export default function ParlayTrustLockModal({
  open,
  title,
  onClose,
  onConfirm,
  isSubmitting = false,
  canUseSubscriber = false,
}: ParlayTrustLockModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [audience, setAudience] = useState<TrustAudience>("private");

  useEffect(() => {
    if (!open) {
      setConfirmed(false);
      setAudience("private");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="parlay-trust-lock-title"
        className="w-full max-w-md rounded-2xl border border-white/12 bg-[var(--bg-graphite)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-vouch-cyan" aria-hidden="true" />
            <h2 id="parlay-trust-lock-title" className="text-sm font-bold text-white">
              Lock to Trust Ledger
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/50 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-white/70">
          <strong className="text-white">{title}</strong> goes to your <strong className="text-white">Private wins</strong> first.
          After {TRUST_LOCK_MINUTES} minutes it locks into your graded trust ledger and counts toward your public win rate.
          You&apos;ll get a reminder {TRUST_LOCK_WARN_MINUTES} minute before lock.
        </p>

        <fieldset className="mt-4 space-y-2">
          <legend className="text-[10px] font-bold uppercase tracking-widest text-white/45">After lock</legend>
          {([
            { id: "private" as const, label: "Private wins", sub: "Only you see it on your ledger" },
            { id: "public" as const, label: "Public proof", sub: "Shareable proof page + feed eligible" },
            { id: "subscriber" as const, label: "Subscribers only", sub: "Followers with access only", disabled: !canUseSubscriber },
          ]).map((opt) => (
            <label
              key={opt.id}
              className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 ${
                audience === opt.id ? "border-vouch-cyan/40 bg-vouch-cyan/10" : "border-white/10"
              } ${opt.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <input
                type="radio"
                name="trust-audience"
                value={opt.id}
                checked={audience === opt.id}
                disabled={opt.disabled}
                onChange={() => setAudience(opt.id)}
                className="mt-0.5 accent-vouch-cyan"
              />
              <span>
                <span className="block text-xs font-bold text-white">{opt.label}</span>
                <span className="block text-[10px] text-white/50">{opt.sub}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 rounded accent-vouch-cyan"
          />
          <span className="text-[11px] leading-relaxed text-white/75">
            I understand this slip will lock for grading truth. Edits and hide are blocked after the {TRUST_LOCK_MINUTES}-minute window.
          </span>
        </label>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/15 py-3 text-xs font-bold uppercase tracking-wide text-white/70"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!confirmed || isSubmitting}
            onClick={() => onConfirm(audience)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-vouch-cyan py-3 text-xs font-bold uppercase tracking-wide text-black disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            {isSubmitting ? "Locking in…" : "Lock in"}
          </button>
        </div>
      </div>
    </div>
  );
}
