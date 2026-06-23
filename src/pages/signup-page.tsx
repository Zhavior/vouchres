import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { ThemeProvider } from "@/components/theme-provider";
import { CyberBackground } from "@/components/cyber-background";

export function SignupPage() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [region, setRegion] = useState("US-CA");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try { await signup(email, username, password, region); navigate("/dashboard"); }
    catch (err: any) { setError(err?.response?.data?.detail || "Signup failed"); }
    finally { setLoading(false); }
  };

  return (
    <ThemeProvider>
      <CyberBackground />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="ve-card p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: "var(--ve-badge-bg)", border: "1px solid var(--ve-badge-border)" }}>
              <svg viewBox="0 0 64 64" className="w-7 h-7">
                <path d="M32 8 L52 18 V38 L32 56 L12 38 V18 Z" stroke="var(--ve-accent)" strokeWidth="3" fill="none"/>
                <circle cx="32" cy="30" r="7" fill="var(--ve-accent)"/>
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold">Create account</h1>
            <p className="text-sm mt-1" style={{ color: "var(--ve-text-muted)" }}>Join VouchEdge — proof over hype</p>
          </div>
          {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--ve-danger)" }}>{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--ve-text-dim)" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="ve-input mt-1" placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--ve-text-dim)" }}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required minLength={3} className="ve-input mt-1" placeholder="MLBfan42" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--ve-text-dim)" }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="ve-input mt-1" placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--ve-text-dim)" }}>Region</label>
              <input type="text" value={region} onChange={e => setRegion(e.target.value)} className="ve-input mt-1" placeholder="US-CA" />
            </div>
            <button type="submit" disabled={loading} className="ve-button w-full disabled:opacity-50">{loading ? "Creating account..." : "Create Account"}</button>
          </form>
          <p className="mt-6 text-center text-sm" style={{ color: "var(--ve-text-muted)" }}>Already have an account? <Link to="/login" style={{ color: "var(--ve-accent)" }} className="hover:underline">Sign in</Link></p>
        </div>
      </div>
    </ThemeProvider>
  );
}
