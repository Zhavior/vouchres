import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  FileText,
  RefreshCw,
  Search,
  Server,
  Shield,
  UserCog,
  Users,
} from 'lucide-react';
import { apiClient, type ApiError } from '../../lib/apiClient';
import {
  AURORA_LABEL,
  AURORA_PANEL_PREMIUM,
  AURORA_SECTION_HEADER,
} from '../../theme/auroraTokens';

type AdminTab = 'overview' | 'waitlist' | 'users' | 'cappers' | 'grading' | 'system';

interface DashboardStats {
  users: number;
  beta: { waitlist: number; invited: number; active: number };
  picks: { total: number; pending: number; graded: number };
  subscriptions: { active: number; gold: number; seller_pro: number };
  estimated_mrr: number;
}

interface BetaSignup {
  id: string;
  email: string;
  state: 'waitlist' | 'invited' | 'active' | 'churned';
  invite_code: string | null;
  invited_at: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  email?: string | null;
  tier?: string | null;
  is_staff?: boolean;
  is_banned?: boolean;
  created_at?: string | null;
}

interface Capper {
  id: string;
  display_name: string;
  is_demo?: boolean;
  trust_score?: number | null;
  total_picks?: number | null;
  won_picks?: number | null;
  lost_picks?: number | null;
}

interface BackendHealth {
  status: 'ok' | 'degraded';
  environment: string;
  uptimeMs: number;
  memory: { rssMb: number; heapUsedMb: number };
  dependencies: {
    redis: { enabled: boolean; mode: string; writeCapable: boolean | null };
    sentry: { enabled: boolean; configured: boolean };
  };
  api: {
    totals: { requests: number; errors: number; slowRequests: number };
    latencyMs: { avg: number; p95: number; max: number };
  };
  config: Array<{ name: string; present: boolean; requiredInProduction: boolean; detail?: string }>;
  warnings: string[];
  updatedAt: string;
}

interface GradingResult {
  graded: number;
  skipped: number;
  warnings?: string[];
  details?: { skipped?: Array<{ pick_id?: string; error?: string }> };
}

const TAB_ITEMS: Array<{ id: AdminTab; label: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'waitlist', label: 'Beta Waitlist', icon: Users },
  { id: 'users', label: 'Users', icon: UserCog },
  { id: 'cappers', label: 'Cappers', icon: Shield },
  { id: 'grading', label: 'Grading', icon: FileText },
  { id: 'system', label: 'System Health', icon: Server },
];

const PANEL = `rounded-lg ${AURORA_PANEL_PREMIUM}`;
const INPUT = 'w-full rounded-md border border-white/10 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400';
const BUTTON = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45';
const PRIMARY_BUTTON = `${BUTTON} border-indigo-400/40 bg-indigo-500/20 text-indigo-100 hover:bg-indigo-500/30`;
const DANGER_BUTTON = `${BUTTON} border-rose-400/35 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20`;

function errorMessage(error: unknown) {
  const apiError = error as ApiError | undefined;
  return apiError?.message || apiError?.error || 'The request could not be completed.';
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
}

function formatUptime(value: number) {
  const seconds = Math.floor(value / 1000);
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function PanelTitle({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <div className={`${AURORA_SECTION_HEADER} flex items-center justify-between gap-4 border-b border-white/5 px-4 py-4 sm:px-5`}>
      <h2 className={`${AURORA_LABEL} text-white`}>{children}</h2>
      {action}
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className={`${PANEL} p-4`}>
      <p className={`${AURORA_LABEL} text-white/50`}>{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs text-white/45">{detail}</p> : null}
    </div>
  );
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const refreshStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const nextStats = await apiClient.get<DashboardStats>('/api/admin/stats');
      setStats(nextStats);
      setStatsError(null);
    } catch (error) {
      setStatsError(errorMessage(error));
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  return (
    <div className="space-y-5">
      <nav className="overflow-x-auto" aria-label="Administrative sections">
        <div className="flex min-w-max gap-2 pb-1">
          {TAB_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'border-indigo-400/40 bg-indigo-500/15 text-indigo-100'
                  : 'border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === 'overview' ? (
        <Overview stats={stats} error={statsError} loading={loadingStats} onRefresh={refreshStats} />
      ) : null}
      {activeTab === 'waitlist' ? <Waitlist /> : null}
      {activeTab === 'users' ? <UsersPanel /> : null}
      {activeTab === 'cappers' ? <CappersPanel /> : null}
      {activeTab === 'grading' ? <GradingPanel /> : null}
      {activeTab === 'system' ? <SystemHealth /> : null}
    </div>
  );
}

function Overview({
  stats,
  error,
  loading,
  onRefresh,
}: {
  stats: DashboardStats | null;
  error: string | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
}) {
  if (loading && !stats) {
    return <div className={`${PANEL} p-5 text-sm text-white/55`}>Loading live admin statistics...</div>;
  }

  if (error && !stats) {
    return (
      <div className={`${PANEL} p-5`}>
        <p className="text-sm text-rose-200">{error}</p>
        <button type="button" className={`${PRIMARY_BUTTON} mt-4`} onClick={() => void onRefresh()}>
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Operations overview</h2>
          <p className="mt-1 text-sm text-white/50">Counts are loaded from the staff API when this page opens or refreshes.</p>
        </div>
        <button type="button" className={BUTTON} onClick={() => void onRefresh()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      {error ? <p className="text-sm text-amber-200">Last refresh failed: {error}</p> : null}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Non-demo users" value={formatNumber(stats.users)} />
        <MetricCard label="Active subscriptions" value={formatNumber(stats.subscriptions.active)} />
        <MetricCard label="Estimated MRR" value={formatCurrency(stats.estimated_mrr)} detail="Calculated by the backend from active subscription tiers." />
        <MetricCard label="Picks awaiting grading" value={formatNumber(stats.picks.pending)} />
      </section>

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle>Beta funnel</PanelTitle>
        <div className="grid grid-cols-1 divide-y divide-white/5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <MetricCell label="Waitlist" value={stats.beta.waitlist} />
          <MetricCell label="Invited" value={stats.beta.invited} />
          <MetricCell label="Activated" value={stats.beta.active} />
        </div>
      </section>

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle>Pick inventory</PanelTitle>
        <div className="grid grid-cols-1 divide-y divide-white/5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <MetricCell label="All picks" value={stats.picks.total} />
          <MetricCell label="Pending" value={stats.picks.pending} />
          <MetricCell label="Graded" value={stats.picks.graded} />
        </div>
      </section>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 sm:p-5">
      <p className={`${AURORA_LABEL} text-white/45`}>{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{formatNumber(value)}</p>
    </div>
  );
}

function Waitlist() {
  const [filter, setFilter] = useState<'all' | BetaSignup['state']>('waitlist');
  const [signups, setSignups] = useState<BetaSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [batchEmails, setBatchEmails] = useState('');
  const [busy, setBusy] = useState(false);

  const loadSignups = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiClient.get<{ signups: BetaSignup[] }>('/api/admin/beta', filter === 'all' ? undefined : { state: filter });
      setSignups(payload.signups ?? []);
      setError(null);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadSignups();
  }, [loadSignups]);

  async function issueInvite(email: string) {
    setBusy(true);
    try {
      await apiClient.post('/api/admin/beta/invite', { email });
      setNotice(`Invite issued for ${email}.`);
      setInviteEmail('');
      await loadSignups();
    } catch (inviteError) {
      setError(errorMessage(inviteError));
    } finally {
      setBusy(false);
    }
  }

  async function issueBatchInvites() {
    const emails = batchEmails.split(/[\n,]/).map((email) => email.trim()).filter(Boolean);
    if (emails.length === 0 || emails.length > 100) {
      setError('Enter between 1 and 100 email addresses.');
      return;
    }

    setBusy(true);
    try {
      const result = await apiClient.post<{ results: Array<{ ok: boolean }> }>('/api/admin/beta/invite-batch', { emails });
      const sent = result.results.filter((item) => item.ok).length;
      setNotice(`Batch invite completed: ${sent} issued, ${result.results.length - sent} not issued.`);
      setBatchEmails('');
      await loadSignups();
    } catch (inviteError) {
      setError(errorMessage(inviteError));
    } finally {
      setBusy(false);
    }
  }

  async function removeSignup(email: string) {
    if (!window.confirm(`Remove ${email} from the beta waitlist?`)) return;
    setBusy(true);
    try {
      await apiClient.delete(`/api/admin/beta/${encodeURIComponent(email)}`);
      setNotice(`Removed ${email} from the waitlist.`);
      await loadSignups();
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle>Beta waitlist</PanelTitle>
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (inviteEmail.trim()) void issueInvite(inviteEmail.trim());
            }}
          >
            <label className="block text-sm font-medium text-white" htmlFor="admin-invite-email">Issue one invite</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input id="admin-invite-email" className={INPUT} type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="person@example.com" required />
              <button type="submit" className={PRIMARY_BUTTON} disabled={busy}>Issue invite</button>
            </div>
          </form>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-white" htmlFor="admin-batch-invites">Issue a batch</label>
            <textarea id="admin-batch-invites" className={`${INPUT} min-h-24`} value={batchEmails} onChange={(event) => setBatchEmails(event.target.value)} placeholder="One email per line or comma separated. Maximum 100." />
            <button type="button" className={BUTTON} onClick={() => void issueBatchInvites()} disabled={busy || !batchEmails.trim()}>Issue batch invites</button>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2" aria-label="Waitlist state filter">
        {(['waitlist', 'invited', 'active', 'churned', 'all'] as const).map((value) => (
          <button key={value} type="button" onClick={() => setFilter(value)} className={filter === value ? PRIMARY_BUTTON : BUTTON}>
            {value === 'all' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
        <button type="button" className={`${BUTTON} ml-auto`} onClick={() => void loadSignups()} disabled={loading || busy}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {notice ? <p className="text-sm text-emerald-200">{notice}</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle>Signups</PanelTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm text-white/70">
            <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase text-white/45">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">State</th>
                <th className="px-4 py-3 font-medium">Invite code</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? <EmptyRow columns={5}>Loading waitlist...</EmptyRow> : null}
              {!loading && signups.length === 0 ? <EmptyRow columns={5}>No signups match this filter.</EmptyRow> : null}
              {!loading ? signups.map((signup) => (
                <tr key={signup.id}>
                  <td className="px-4 py-3 text-white">{signup.email}</td>
                  <td className="px-4 py-3 capitalize">{signup.state}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/55">{signup.invite_code ?? 'Not issued'}</td>
                  <td className="px-4 py-3 text-xs text-white/50">{formatDate(signup.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {signup.state === 'waitlist' ? <button type="button" className={BUTTON} onClick={() => void issueInvite(signup.email)} disabled={busy}>Invite</button> : null}
                      <button type="button" className={DANGER_BUTTON} onClick={() => void removeSignup(signup.email)} disabled={busy}>Remove</button>
                    </div>
                  </td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function UsersPanel() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiClient.get<{ users: UserProfile[] }>('/api/admin/users', submittedQuery ? { search: submittedQuery, limit: 100 } : { limit: 100 });
      setUsers(payload.users ?? []);
      setError(null);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [submittedQuery]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function updateUser(user: UserProfile, changes: Record<string, boolean>, action: string) {
    const name = user.display_name || user.username || user.id;
    if (!window.confirm(`${action} ${name}?`)) return;

    setPendingAction(user.id);
    try {
      await apiClient.patch(`/api/admin/users/${user.id}`, changes);
      await loadUsers();
    } catch (updateError) {
      setError(errorMessage(updateError));
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className={`${PANEL} p-4 sm:p-5`}>
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(event) => { event.preventDefault(); setSubmittedQuery(query.trim()); }}>
          <label className="sr-only" htmlFor="admin-user-search">Search users</label>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input id="admin-user-search" className={`${INPUT} pl-9`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search username or display name" />
          </div>
          <button type="submit" className={PRIMARY_BUTTON}>Search</button>
          <button type="button" className={BUTTON} onClick={() => void loadUsers()} disabled={loading || pendingAction !== null}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </form>
      </section>

      {error ? <p className="text-sm text-rose-200">{error}</p> : null}

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle>Users</PanelTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm text-white/70">
            <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase text-white/45">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Staff</th>
                <th className="px-4 py-3 font-medium">Account status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? <EmptyRow columns={6}>Loading users...</EmptyRow> : null}
              {!loading && users.length === 0 ? <EmptyRow columns={6}>No users match this search.</EmptyRow> : null}
              {!loading ? users.map((user) => {
                const busy = pendingAction === user.id;
                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-white">
                      <p className="font-medium">{user.display_name || user.username || 'Unnamed user'}</p>
                      <p className="mt-0.5 text-xs text-white/45">@{user.username || user.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs uppercase">{user.tier || 'free'}</td>
                    <td className="px-4 py-3">{user.is_staff ? 'Staff' : 'User'}</td>
                    <td className="px-4 py-3">{user.is_banned ? 'Banned' : 'Active'}</td>
                    <td className="px-4 py-3 text-xs text-white/50">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" className={user.is_banned ? BUTTON : DANGER_BUTTON} onClick={() => void updateUser(user, { is_banned: !user.is_banned }, user.is_banned ? 'Restore access for' : 'Ban')} disabled={busy}>
                          {user.is_banned ? 'Restore' : 'Ban'}
                        </button>
                        <button type="button" className={user.is_staff ? DANGER_BUTTON : BUTTON} onClick={() => void updateUser(user, { is_staff: !user.is_staff }, user.is_staff ? 'Remove staff access from' : 'Grant staff access to')} disabled={busy}>
                          {user.is_staff ? 'Remove staff' : 'Grant staff'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CappersPanel() {
  const [cappers, setCappers] = useState<Capper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newCapper, setNewCapper] = useState({ id: '', display_name: '', tagline: '', persona: '', is_demo: false });

  const loadCappers = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiClient.get<{ cappers: Capper[] }>('/api/cappers');
      setCappers(payload.cappers ?? []);
      setError(null);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCappers();
  }, [loadCappers]);

  async function createCapper(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    try {
      const payload = { ...newCapper, id: newCapper.id.trim().toLowerCase(), display_name: newCapper.display_name.trim() };
      await apiClient.post('/api/admin/cappers', payload);
      setNotice(`Created ${payload.display_name}.`);
      setNewCapper({ id: '', display_name: '', tagline: '', persona: '', is_demo: false });
      await loadCappers();
    } catch (createError) {
      setError(errorMessage(createError));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle
          action={
            <button type="button" className={BUTTON} onClick={() => void loadCappers()} disabled={loading || creating}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          }
        >
          Existing cappers
        </PanelTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm text-white/70">
            <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase text-white/45">
              <tr><th className="px-4 py-3 font-medium">ID</th><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Trust</th><th className="px-4 py-3 font-medium">Record</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? <EmptyRow columns={5}>Loading cappers...</EmptyRow> : null}
              {!loading && cappers.length === 0 ? <EmptyRow columns={5}>No cappers returned by the API.</EmptyRow> : null}
              {!loading ? cappers.map((capper) => <tr key={capper.id}><td className="px-4 py-3 font-mono text-xs text-white">{capper.id}</td><td className="px-4 py-3 text-white">{capper.display_name}</td><td className="px-4 py-3">{capper.is_demo === true ? 'Demo' : capper.is_demo === false ? 'Live' : 'Unknown'}</td><td className="px-4 py-3">{capper.trust_score == null ? 'Unavailable' : capper.trust_score.toFixed(1)}</td><td className="px-4 py-3">{formatNumber(capper.won_picks)}-{formatNumber(capper.lost_picks)} ({formatNumber(capper.total_picks)} picks)</td></tr>) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${PANEL} overflow-hidden`}>
        <PanelTitle>Create capper</PanelTitle>
        <form className="grid gap-4 p-4 sm:p-5 md:grid-cols-2" onSubmit={(event) => void createCapper(event)}>
          <label className="text-sm text-white/75">ID<input className={`${INPUT} mt-1`} value={newCapper.id} onChange={(event) => setNewCapper({ ...newCapper, id: event.target.value })} pattern="[a-z0-9-]{2,32}" placeholder="lowercase-hyphens" required /></label>
          <label className="text-sm text-white/75">Display name<input className={`${INPUT} mt-1`} value={newCapper.display_name} onChange={(event) => setNewCapper({ ...newCapper, display_name: event.target.value })} required /></label>
          <label className="text-sm text-white/75">Tagline<input className={`${INPUT} mt-1`} value={newCapper.tagline} onChange={(event) => setNewCapper({ ...newCapper, tagline: event.target.value })} maxLength={140} /></label>
          <label className="text-sm text-white/75">Persona<textarea className={`${INPUT} mt-1 min-h-20`} value={newCapper.persona} onChange={(event) => setNewCapper({ ...newCapper, persona: event.target.value })} maxLength={1000} /></label>
          <label className="flex min-h-10 items-center gap-2 text-sm text-white/75"><input type="checkbox" checked={newCapper.is_demo} onChange={(event) => setNewCapper({ ...newCapper, is_demo: event.target.checked })} /> Demo capper</label>
          <div className="flex items-end"><button type="submit" className={PRIMARY_BUTTON} disabled={creating}>Create capper</button></div>
        </form>
      </section>
      {notice ? <p className="text-sm text-emerald-200">{notice}</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
    </div>
  );
}

function GradingPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runGrading(dryRun: boolean) {
    if (!dryRun && !window.confirm('Run live grading for pending picks from the past three days?')) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await apiClient.post<GradingResult>('/api/admin/grade-pending', { days: 3, dryRun });
      setResult(response);
    } catch (gradingError) {
      setError(errorMessage(gradingError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className={`${PANEL} p-4 sm:p-5`}>
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-indigo-300" />
          <div>
            <h2 className="text-base font-semibold text-white">Manual pick grading</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/55">Checks pending picks from the past three days. A dry run performs the same checks without writing results.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={BUTTON} onClick={() => void runGrading(true)} disabled={loading}>Dry run</button>
              <button type="button" className={DANGER_BUTTON} onClick={() => void runGrading(false)} disabled={loading}>Run live grading</button>
            </div>
          </div>
        </div>
      </section>
      {loading ? <p className="text-sm text-white/55">Grading is running. This can take a while for a large queue.</p> : null}
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      {result ? <section className={`${PANEL} overflow-hidden`}><PanelTitle>Latest grading result</PanelTitle><div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5"><MetricCard label="Graded" value={formatNumber(result.graded)} /><MetricCard label="Skipped" value={formatNumber(result.skipped)} /></div>{result.warnings?.length ? <ul className="border-t border-white/5 px-5 py-4 text-sm text-amber-200">{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}{result.details?.skipped?.length ? <details className="border-t border-white/5 px-5 py-4 text-sm text-white/60"><summary className="cursor-pointer text-white">Skipped pick details</summary><ul className="mt-3 space-y-2">{result.details.skipped.slice(0, 50).map((item, index) => <li key={`${item.pick_id ?? 'pick'}-${index}`}><code className="text-xs text-white/80">{item.pick_id ?? 'Unknown pick'}</code>: {item.error ?? 'No reason returned'}</li>)}</ul></details> : null}</section> : null}
    </div>
  );
}

function SystemHealth() {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiClient.get<BackendHealth>('/api/health/backend');
      setHealth(payload);
      setError(null);
    } catch (healthError) {
      setError(errorMessage(healthError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  const configChecks = useMemo(() => health?.config ?? [], [health]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-white">Backend health</h2><p className="mt-1 text-sm text-white/50">The service reports its own dependency, configuration, and route telemetry state.</p></div>
        <button type="button" className={BUTTON} onClick={() => void loadHealth()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      {loading && !health ? <div className={`${PANEL} p-5 text-sm text-white/55`}>Loading backend health...</div> : null}
      {health ? <>
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Service status" value={health.status === 'ok' ? 'Operational' : 'Degraded'} detail={`Updated ${formatDate(health.updatedAt)}`} />
          <MetricCard label="Environment" value={health.environment} detail={`Uptime ${formatUptime(health.uptimeMs)}`} />
          <MetricCard label="API errors" value={formatNumber(health.api.totals.errors)} detail={`${formatNumber(health.api.totals.requests)} requests since process start`} />
          <MetricCard label="P95 latency" value={`${formatNumber(health.api.latencyMs.p95)} ms`} detail={`${formatNumber(health.api.totals.slowRequests)} slow requests`} />
        </section>
        <section className={`${PANEL} overflow-hidden`}><PanelTitle>Dependencies</PanelTitle><div className="grid grid-cols-1 divide-y divide-white/5 sm:grid-cols-3 sm:divide-x sm:divide-y-0"><MetricCell label={`Redis (${health.dependencies.redis.mode})`} value={health.dependencies.redis.enabled ? 'Enabled' : 'Disabled'} /><MetricCell label="Redis writes" value={health.dependencies.redis.writeCapable === null ? 'Not checked' : health.dependencies.redis.writeCapable ? 'Available' : 'Unavailable'} /><MetricCell label="Sentry" value={health.dependencies.sentry.configured ? 'Configured' : 'Not configured'} /></div><div className="grid grid-cols-1 border-t border-white/5 text-xs text-white/45 sm:grid-cols-2"><p className="p-3">Heap used: {health.memory.heapUsedMb} MB</p><p className="p-3">RSS memory: {health.memory.rssMb} MB</p></div></section>
        <section className={`${PANEL} overflow-hidden`}><PanelTitle>Warnings</PanelTitle><div className="p-4 sm:p-5">{health.warnings.length ? <ul className="space-y-2 text-sm text-amber-200">{health.warnings.map((warning) => <li key={warning} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{warning}</li>)}</ul> : <p className="text-sm text-emerald-200">No backend warnings reported.</p>}</div></section>
        <section className={`${PANEL} overflow-hidden`}><PanelTitle>Configuration checks</PanelTitle><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm text-white/70"><thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase text-white/45"><tr><th className="px-4 py-3 font-medium">Setting</th><th className="px-4 py-3 font-medium">Present</th><th className="px-4 py-3 font-medium">Required in production</th><th className="px-4 py-3 font-medium">Detail</th></tr></thead><tbody className="divide-y divide-white/5">{configChecks.map((check) => <tr key={check.name}><td className="px-4 py-3 font-mono text-xs text-white">{check.name}</td><td className="px-4 py-3">{check.present ? 'Yes' : 'No'}</td><td className="px-4 py-3">{check.requiredInProduction ? 'Yes' : 'No'}</td><td className="px-4 py-3 text-xs text-white/50">{check.detail ?? 'None'}</td></tr>)}</tbody></table></div></section>
      </> : null}
    </div>
  );
}

function EmptyRow({ columns, children }: { columns: number; children: ReactNode }) {
  return <tr><td colSpan={columns} className="px-4 py-9 text-center text-sm text-white/45">{children}</td></tr>;
}
