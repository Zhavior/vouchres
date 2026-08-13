import { Lock } from 'lucide-react';

/**
 * AuroraHqProGateBadge — shown in Free Mode in place of Statcast detail rows.
 * Renders a subtle lock badge: 🔒 PRO FEATURE: UNLOCK STATCAST VECTORS
 */
export function AuroraHqProGateBadge() {
  return (
    <div className="aurora-hq__pro-gate" aria-label="Pro feature — Statcast vectors locked">
      <Lock className="h-2.5 w-2.5 shrink-0" style={{ color: 'rgba(251, 191, 36, 0.65)' }} aria-hidden="true" />
      <span className="aurora-hq__pro-gate-text">
        Pro feature: Unlock Statcast Vectors
      </span>
    </div>
  );
}
