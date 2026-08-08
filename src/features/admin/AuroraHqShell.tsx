import { Shield } from 'lucide-react';
import { useAppProfile } from '../../context/AppShellContext';
import {
  AURORA_LABEL,
  AURORA_PAGE,
  AURORA_PAGE_PAD_X,
  AURORA_PAGE_PAD_Y,
} from '../../theme/auroraTokens';
import { AdminDashboard } from '../../components/admin/AdminDashboard';

export default function AuroraHqShell() {
  const profile = useAppProfile();

  if (!profile?.isAdmin) {
    return (
      <div className={`p-8 text-center text-white ${AURORA_PAGE}`}>
        <p>Access denied. This area is limited to staff accounts.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-0 min-w-0 overflow-x-hidden ve-safe-bottom pb-24 md:pb-8 ${AURORA_PAGE}`}>
      <header className={`glass-command border-b border-white/5 bg-black/40 py-4 sm:py-5 ${AURORA_PAGE_PAD_X}`}>
        <div className="mx-auto max-w-7xl">
          <div className={`flex items-center gap-2 text-white/45 ${AURORA_LABEL}`}>
            <Shield className="h-3.5 w-3.5" />
            Staff operations
          </div>
          <h1 className="mt-1 text-lg font-semibold text-white sm:text-xl">VouchEdge Admin</h1>
        </div>
      </header>
      <main className={`mx-auto max-w-7xl ${AURORA_PAGE_PAD_Y} ${AURORA_PAGE_PAD_X}`}>
        <AdminDashboard />
      </main>
    </div>
  );
}
