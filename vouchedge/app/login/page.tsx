"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Login failed.");
      }

      localStorage.setItem("vouchedge_auth_token", json.token);
      localStorage.setItem("vouchedge_user", JSON.stringify(json.user));

      window.location.href = "/edge-island";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,.25),transparent_30%),radial-gradient(circle_at_80%_25%,rgba(16,185,129,.15),transparent_28%),linear-gradient(180deg,#020617,#000)]" />

      <div className="absolute bottom-0 left-0 right-0 h-56 overflow-hidden">
        <div className="absolute bottom-[-80px] left-1/2 h-56 w-[900px] -translate-x-1/2 rounded-full bg-cyan-300/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
        <div className="absolute bottom-8 left-0 h-px w-full bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent animate-pulse" />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
        <Link href="/" className="text-3xl font-black italic">
          Vouch<span className="text-cyan-300">Edge</span>
        </Link>

        <Link href="/" className="text-xs font-black uppercase tracking-widest text-white/50 hover:text-cyan-300">
          Back Home
        </Link>
      </nav>

      <section className="relative z-10 mx-auto flex min-h-[78vh] max-w-7xl items-center justify-center px-6">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.045] p-8 shadow-[0_35px_120px_rgba(0,0,0,.6)] backdrop-blur-xl">
          <div className="mb-8">
            <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              Secure Access
            </div>
            <h1 className="mt-4 text-4xl font-black uppercase tracking-tight">
              Enter the Terminal
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/45">
              Login through the backend to access Edge Island.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none placeholder:text-white/25 focus:border-cyan-300"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <input
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none placeholder:text-white/25 focus:border-cyan-300"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              disabled={busy}
              className="w-full rounded-2xl bg-cyan-300 px-6 py-4 text-center font-black uppercase tracking-widest text-black hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Authenticating..." : "Login"}
            </button>
          </form>

          <div className="mt-6 flex justify-between text-xs text-white/40">
            <span>Need access?</span>
            <Link href="/pricing" className="text-cyan-300 hover:text-white">
              View plans
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
