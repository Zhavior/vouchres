import type { ReactNode } from 'react';
import type { CreatorProofProfile } from '../../types';
import { canAccessHrNext } from '../../lib/adminDevAccess';
import { Lock } from 'lucide-react';
import { AURORA_LABEL, AURORA_PANEL_PREMIUM } from '../../theme/auroraTokens';

interface AdminAccessGateProps {
  profile: CreatorProofProfile | null | undefined;
  children: ReactNode;
}

export function AdminAccessGate({ profile, children }: AdminAccessGateProps) {
  if (canAccessHrNext(profile)) {
    return <>{children}</>;
  }

  return (
    <main className="ve-page-shell flex min-h-screen items-center justify-center px-3 py-8 text-white sm:px-4 sm:py-10">
      <section className={`${AURORA_PANEL_PREMIUM} w-full max-w-xl space-y-5 p-5 text-left sm:p-6`} aria-labelledby="admin-access-gate-title">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-500">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 space-y-1.5">
            <p className={`${AURORA_LABEL} text-rose-500`}>Restricted Access</p>
            <h1 id="admin-access-gate-title" className="text-2xl font-black tracking-tight text-white">Staff Only</h1>
            <p className="text-sm font-bold text-white/75">You do not have permission to view this page.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminAccessGate;
