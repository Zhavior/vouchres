import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";

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
    setLoading(true);
    setError(null);
    try {
      await signup(email, username, password, region);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-gradient flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <img src="/vouchedge-icon.svg" alt="VouchEdge" className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-2xl font-extrabold">Create account</h1>
          <p className="text-sm text-slate-400 mt-1">Join VouchEdge MLB</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-navy-900 border border-navy-600 text-slate-100 focus:border-electric-500 focus:outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-navy-900 border border-navy-600 text-slate-100 focus:border-electric-500 focus:outline-none transition-colors"
              placeholder="MLBfan42"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-navy-900 border border-navy-600 text-slate-100 focus:border-electric-500 focus:outline-none transition-colors"
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Region</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-lg bg-navy-900 border border-navy-600 text-slate-100 focus:border-electric-500 focus:outline-none transition-colors"
              placeholder="US-CA"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full electric-button text-sm disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-electric-300 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
