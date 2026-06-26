import { useState } from "react";
import { supabase, signInWithEmail, signUpWithEmail, signInWithMagicLink } from "../../lib/supabaseClient";

interface AuthGateProps {
  onAuthed?: () => void;
  inviteCodeRequired?: boolean; // true during private beta
}

/**
 * AuthGate — login / signup screen shown when user is not authenticated.
 *
 * Replaces the implicit "always-logged-in-as-u-user-current" model in App.tsx.
 *
 * During private beta, set inviteCodeRequired=true — signups must supply an
 * invite code (issued via /api/admin/issue-invite).
 */
export function AuthGate({ onAuthed, inviteCodeRequired = true }: AuthGateProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signin") {
        const { error } = await signInWithEmail({ email, password });
        if (error) throw error;
        onAuthed?.();
      } else {
        if (inviteCodeRequired && !inviteCode.trim()) {
          throw new Error("Invite code required for beta access");
        }
        if (username.trim().length < 3) {
          throw new Error("Username must be at least 3 characters");
        }
        const { error } = await signUpWithEmail({
          email,
          password,
          username: username.trim(),
          inviteCode: inviteCode.trim() || undefined,
        });
        if (error) throw error;
        // After signup, Supabase sends a confirmation email (depending on project settings).
        setMagicLinkSent(true);
      }
    } catch (err: any) {
      setError(err?.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Enter your email first");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await signInWithMagicLink(email);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
  }

  if (magicLinkSent) {
    return (
      <div className="auth-gate">
        <h2>Check your email</h2>
        <p>
          We sent a magic link to <strong>{email}</strong>. Click the link to
          sign in. The link expires in 1 hour.
        </p>
        <button onClick={() => setMagicLinkSent(false)}>Back to sign in</button>
      </div>
    );
  }

  return (
    <div className="auth-gate">
      <div className="auth-gate__card">
        <h2>{mode === "signin" ? "Sign in to VouchEdge" : "Create your VouchEdge account"}</h2>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Username (3-24 chars)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={24}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          {mode === "signup" && inviteCodeRequired && (
            <input
              type="text"
              placeholder="Invite code (VE-XXXXXXXX)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
            />
          )}

          {error && <div className="auth-gate__error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Loading…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="auth-gate__divider">or</div>

        <button
          type="button"
          onClick={handleMagicLink}
          disabled={loading}
          className="auth-gate__magic-link"
        >
          Sign in with email link
        </button>

        <p className="auth-gate__toggle">
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>

        {inviteCodeRequired && (
          <p className="auth-gate__beta-note">
            VouchEdge is in private beta. Need an invite code?{" "}
            <a href="/premium">Join the waitlist</a>.
          </p>
        )}

        <p className="auth-gate__legal">
          By signing in, you agree to our{" "}
          <a href="/terms">Terms</a> and{" "}
          <a href="/privacy">Privacy Policy</a>. You must be 21+ and located in
          a jurisdiction where sports betting is legal to use this app.
          Predictions are for research and entertainment only — not betting advice.
        </p>
      </div>
    </div>
  );
}
