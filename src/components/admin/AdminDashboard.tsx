import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../../lib/apiClient";
import { appAlert } from "../../lib/appToast";
import { AdminHealthTab } from "./AdminHealthTab";

/**
 * AdminDashboard — staff-only UI for managing the beta waitlist,
 * triggering grading jobs, viewing user stats, and managing cappers.
 *
 * Access control: the backend enforces requireStaff on every endpoint.
 * This UI just hides the page from non-staff users — if a non-staff
 * user navigates here directly, every API call will return 403.
 *
 * Mount at /admin in your router.
 */

interface BetaSignup {
  id: string;
  email: string;
  state: "waitlist" | "invited" | "active" | "churned";
  invite_code: string | null;
  invited_at: string | null;
  activated_user_id: string | null;
  created_at: string;
}

interface DashboardStats {
  users: number;
  beta: { waitlist: number; invited: number; active: number };
  picks: { total: number; pending: number; graded: number };
  subscriptions: { active: number; gold: number; seller_pro: number };
  estimated_mrr: number;
}

type Tab = "stats" | "beta" | "users" | "cappers" | "grading" | "health";

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      const data = await apiClient.get<DashboardStats>("/api/admin/stats");
      setStats(data);
    } catch (err) {
      console.error("[admin] stats fetch failed", err);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>VouchEdge Admin</h1>
        {stats && (
          <div className="admin-header__stats">
            <span>👥 {stats.users} users</span>
            <span>🎫 {stats.beta.waitlist} waitlist</span>
            <span>✅ {stats.beta.active} active</span>
            <span>⭐ {stats.subscriptions.active} subs</span>
            <span>💰 ${stats.estimated_mrr}/mo MRR</span>
          </div>
        )}
        <button onClick={refreshStats}>Refresh</button>
      </header>

      <nav className="admin-nav">
        <button
          onClick={() => setTab("stats")}
          className={tab === "stats" ? "active" : ""}
        >Stats</button>
        <button
          onClick={() => setTab("beta")}
          className={tab === "beta" ? "active" : ""}
        >Beta Waitlist</button>
        <button
          onClick={() => setTab("users")}
          className={tab === "users" ? "active" : ""}
        >Users</button>
        <button
          onClick={() => setTab("cappers")}
          className={tab === "cappers" ? "active" : ""}
        >Cappers</button>
        <button
          onClick={() => setTab("grading")}
          className={tab === "grading" ? "active" : ""}
        >Grading</button>
        <button
          onClick={() => setTab("health")}
          className={tab === "health" ? "active" : ""}
        >System Health</button>
      </nav>

      <main className="admin-main">
        {tab === "stats" && <StatsTab stats={stats} onRefresh={refreshStats} />}
        {tab === "beta" && <BetaTab />}
        {tab === "users" && <UsersTab />}
        {tab === "cappers" && <CappersTab />}
        {tab === "grading" && <GradingTab />}
        {tab === "health" && <AdminHealthTab />}
      </main>
    </div>
  );
}

// =========================================================
// Stats tab
// =========================================================

function StatsTab({ stats, onRefresh }: { stats: DashboardStats | null; onRefresh: () => void }) {
  if (!stats) return <p>Loading…</p>;

  return (
    <div className="admin-stats">
      <div className="admin-stats__grid">
        <StatCard label="Total Users" value={stats.users} />
        <StatCard label="Active Subscriptions" value={stats.subscriptions.active} />
        <StatCard label="Gold Subscribers" value={stats.subscriptions.gold} />
        <StatCard label="Seller PRO Subscribers" value={stats.subscriptions.seller_pro} />
        <StatCard label="Estimated MRR" value={`$${stats.estimated_mrr}/mo`} />
      </div>

      <h3>Beta Funnel</h3>
      <div className="admin-stats__grid">
        <StatCard label="On Waitlist" value={stats.beta.waitlist} />
        <StatCard label="Invited" value={stats.beta.invited} />
        <StatCard label="Activated" value={stats.beta.active} />
      </div>

      <h3>Picks</h3>
      <div className="admin-stats__grid">
        <StatCard label="Total Picks" value={stats.picks.total} />
        <StatCard label="Pending Grading" value={stats.picks.pending} />
        <StatCard label="Graded" value={stats.picks.graded} />
      </div>

      <button onClick={onRefresh}>Refresh stats</button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  );
}

// =========================================================
// Beta waitlist tab
// =========================================================

function BetaTab() {
  const [signups, setSignups] = useState<BetaSignup[]>([]);
  const [filter, setFilter] = useState<"all" | "waitlist" | "invited" | "active">("waitlist");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [batchEmails, setBatchEmails] = useState("");

  const fetchSignups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ signups: BetaSignup[]; total: number }>(
        "/api/admin/beta",
        filter === "all" ? {} : { state: filter }
      );
      setSignups(data.signups);
      setError(null);
    } catch (err: any) {
      setError(err?.error ?? "fetch_failed");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSignups();
  }, [fetchSignups]);

  async function handleInvite(email: string) {
    try {
      await apiClient.post("/api/admin/beta/invite", { email });
      await fetchSignups();
    } catch (err: any) {
      appAlert(`Failed to invite ${email}: ${err?.error ?? "unknown"}`, "error");
    }
  }

  async function handleBatchInvite() {
    const emails = batchEmails
      .split(/[\n,]/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) return;

    try {
      const result = await apiClient.post<{ results: any[] }>(
        "/api/admin/beta/invite-batch",
        { emails }
      );
      const ok = result.results.filter((r) => r.ok).length;
      const failed = result.results.filter((r) => !r.ok).length;
      appAlert(`Invited ${ok}, failed ${failed}`, failed > 0 ? "warning" : "success");
      setBatchEmails("");
      await fetchSignups();
    } catch (err: any) {
      appAlert(`Batch invite failed: ${err?.error ?? "unknown"}`, "error");
    }
  }

  async function handleDelete(email: string) {
    if (!confirm(`Remove ${email} from waitlist?`)) return;
    try {
      await apiClient.delete(`/api/admin/beta/${encodeURIComponent(email)}`);
      await fetchSignups();
    } catch (err: any) {
      appAlert(`Failed to delete: ${err?.error ?? "unknown"}`, "error");
    }
  }

  return (
    <div className="admin-beta">
      <div className="admin-beta__filters">
        {(["waitlist", "invited", "active", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={filter === f ? "active" : ""}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-beta__invite">
        <h3>Invite single user</h3>
        <input
          type="email"
          placeholder="user@example.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />
        <button
          onClick={() => {
            if (inviteEmail) handleInvite(inviteEmail);
            setInviteEmail("");
          }}
          disabled={!inviteEmail}
        >
          Issue invite
        </button>
      </div>

      <div className="admin-beta__batch">
        <h3>Batch invite (one email per line, or comma-separated)</h3>
        <textarea
          rows={4}
          placeholder={"user1@example.com\nuser2@example.com"}
          value={batchEmails}
          onChange={(e) => setBatchEmails(e.target.value)}
        />
        <button onClick={handleBatchInvite} disabled={!batchEmails.trim()}>
          Issue batch invites
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="admin-beta__error">{error}</p>}

      <table className="admin-beta__table">
        <thead>
          <tr>
            <th>Email</th>
            <th>State</th>
            <th>Invite Code</th>
            <th>Invited</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {signups.map((s) => (
            <tr key={s.id}>
              <td>{s.email}</td>
              <td><span className={`state state--${s.state}`}>{s.state}</span></td>
              <td className="admin-beta__code">
                {s.invite_code ? (
                  <code>{s.invite_code}</code>
                ) : "—"}
              </td>
              <td>{s.invited_at ? new Date(s.invited_at).toLocaleString() : "—"}</td>
              <td>{new Date(s.created_at).toLocaleDateString()}</td>
              <td>
                {s.state === "waitlist" && (
                  <button onClick={() => handleInvite(s.email)}>Invite</button>
                )}
                <button onClick={() => handleDelete(s.email)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =========================================================
// Users tab
// =========================================================

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<{ users: any[] }>("/api/admin/users", search ? { search } : {});
      setUsers(data.users);
    } catch (err) {
      console.error("[admin] users fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleAction(id: string, action: "ban" | "unban" | "promote" | "demote") {
    const updates: any = {};
    if (action === "ban") updates.is_banned = true;
    if (action === "unban") updates.is_banned = false;
    if (action === "promote") updates.is_staff = true;
    if (action === "demote") updates.is_staff = false;

    const reason = prompt(`Reason for ${action}? (optional)`) ?? "";
    if (reason) updates.reason = reason;

    try {
      await apiClient.patch(`/api/admin/users/${id}`, updates);
      await fetchUsers();
    } catch (err: any) {
      appAlert(`Failed: ${err?.error ?? "unknown"}`, "error");
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="admin-users">
      <input
        type="text"
        placeholder="Search by username or display name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Tier</th>
            <th>Staff</th>
            <th>Banned</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                <div>{u.display_name}</div>
                <div className="admin-users__username">@{u.username}</div>
              </td>
              <td>{u.tier}</td>
              <td>{u.is_staff ? "✓" : ""}</td>
              <td>{u.is_banned ? "BANNED" : ""}</td>
              <td>{new Date(u.created_at).toLocaleDateString()}</td>
              <td>
                {u.is_banned ? (
                  <button onClick={() => handleAction(u.id, "unban")}>Unban</button>
                ) : (
                  <button onClick={() => handleAction(u.id, "ban")}>Ban</button>
                )}
                {u.is_staff ? (
                  <button onClick={() => handleAction(u.id, "demote")}>Demote</button>
                ) : (
                  <button onClick={() => handleAction(u.id, "promote")}>Promote</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =========================================================
// Cappers tab
// =========================================================

function CappersTab() {
  const [cappers, setCappers] = useState<any[]>([]);
  const [newCapper, setNewCapper] = useState({
    id: "",
    display_name: "",
    tagline: "",
    is_demo: true,
  });

  const fetchCappers = useCallback(async () => {
    try {
      const data = await apiClient.get<{ cappers: any[] }>("/api/cappers");
      setCappers(data.cappers);
    } catch (err) {
      console.error("[admin] cappers fetch failed", err);
    }
  }, []);

  useEffect(() => {
    fetchCappers();
  }, [fetchCappers]);

  async function handleCreate() {
    if (!newCapper.id || !newCapper.display_name) return;
    try {
      await apiClient.post("/api/admin/cappers", newCapper);
      setNewCapper({ id: "", display_name: "", tagline: "", is_demo: true });
      await fetchCappers();
    } catch (err: any) {
      appAlert(`Failed: ${err?.error ?? "unknown"}`, "error");
    }
  }

  return (
    <div className="admin-cappers">
      <h3>Existing Cappers</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Demo?</th>
            <th>Trust</th>
            <th>Picks</th>
            <th>Record</th>
          </tr>
        </thead>
        <tbody>
          {cappers.map((c) => (
            <tr key={c.id}>
              <td><code>{c.id}</code></td>
              <td>{c.display_name}</td>
              <td>{c.is_demo ? "DEMO" : ""}</td>
              <td>{c.trust_score?.toFixed(1)}</td>
              <td>{c.total_picks}</td>
              <td>{c.won_picks}-{c.lost_picks}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Create New Capper</h3>
      <div className="admin-cappers__form">
        <input
          placeholder="id (lowercase, hyphens)"
          value={newCapper.id}
          onChange={(e) => setNewCapper({ ...newCapper, id: e.target.value })}
        />
        <input
          placeholder="Display name"
          value={newCapper.display_name}
          onChange={(e) => setNewCapper({ ...newCapper, display_name: e.target.value })}
        />
        <input
          placeholder="Tagline (optional)"
          value={newCapper.tagline}
          onChange={(e) => setNewCapper({ ...newCapper, tagline: e.target.value })}
        />
        <label>
          <input
            type="checkbox"
            checked={newCapper.is_demo}
            onChange={(e) => setNewCapper({ ...newCapper, is_demo: e.target.checked })}
          />
          Demo capper (not a real person)
        </label>
        <button onClick={handleCreate} disabled={!newCapper.id || !newCapper.display_name}>
          Create capper
        </button>
      </div>
    </div>
  );
}

// =========================================================
// Grading tab
// =========================================================

function GradingTab() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runGrade(dryRun: boolean) {
    setLoading(true);
    setResult(null);
    try {
      const data = await apiClient.post("/api/admin/grade-pending", { days: 3, dryRun });
      setResult(data);
    } catch (err: any) {
      setResult({ error: err?.error ?? "grade_failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-grading">
      <h3>Manual Pick Grading</h3>
      <p>
        This triggers the grading job immediately. The cron job runs this
        automatically at 2 AM ET, but you can run it manually to catch
        picks from games that ended recently.
      </p>

      <div className="admin-grading__buttons">
        <button onClick={() => runGrade(true)} disabled={loading}>
          Dry run (no writes)
        </button>
        <button onClick={() => runGrade(false)} disabled={loading}>
          Run for real
        </button>
      </div>

      {loading && <p>Grading… (this may take 30+ seconds for many picks)</p>}

      {result && (
        <div className="admin-grading__result">
          {result.error ? (
            <p className="admin-grading__error">Error: {result.error}</p>
          ) : (
            <>
              <p>✅ Graded: {result.graded}</p>
              <p>⏭️ Skipped: {result.skipped}</p>
              {result.details?.skipped?.length > 0 && (
                <details>
                  <summary>Skip reasons ({result.details.skipped.length})</summary>
                  <ul>
                    {result.details.skipped.slice(0, 50).map((s: any, i: number) => (
                      <li key={i}>
                        <code>{s.pick_id}</code>: {s.error}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
