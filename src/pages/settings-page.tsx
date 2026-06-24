/**
 * SettingsPage — Profile settings and preferences.
 * Uses useAuthStore for current user and profileApi for save operations.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, Save, Check, User, Shield, Sliders } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { profileApi } from "@/services/profile";

type Tab = "profile" | "preferences" | "account";

export function SettingsPage() {
  const me = useAuthStore((s) => s.me);
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.get(),
    enabled: !!me,
  });

  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [mode, setMode] = useState<"beginner" | "advanced">("beginner");
  const [favoriteTeams, setFavoriteTeams] = useState("");
  const [preferredMarkets, setPreferredMarkets] = useState("");

  // Pre-fill when profile loads
  useState(() => {
    if (profileData) {
      setBio(profileData.bio ?? "");
      setAvatarUrl(profileData.avatar_url ?? "");
      setMode((profileData.mode as "beginner" | "advanced") ?? "beginner");
      setFavoriteTeams((profileData.favorite_teams ?? []).join(", "));
      setPreferredMarkets((profileData.preferred_markets ?? []).join(", "));
    }
  });

  const updateMutation = useMutation({
    mutationFn: profileApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      bio: bio || undefined,
      avatar_url: avatarUrl || undefined,
      mode,
      favorite_teams: favoriteTeams ? favoriteTeams.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      preferred_markets: preferredMarkets ? preferredMarkets.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    });
  };

  const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "preferences", label: "Preferences", icon: Sliders },
    { id: "account", label: "Account", icon: Shield },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-sky-400" />
        <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Settings</h2>
      </div>

      {/* Tab navigation */}
      <div className="ve-card p-1 flex gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === id
                ? "bg-sky-950/60 text-sky-400 border border-sky-800/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Profile */}
      {activeTab === "profile" && (
        <form onSubmit={handleSave} className="ve-card p-5 space-y-4 animate-slide-up">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Profile Details</h3>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">Username</label>
            <input
              value={me?.user?.username ?? ""}
              readOnly
              className="ve-input text-sm opacity-60 cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-600 mt-1">Username cannot be changed.</p>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={280}
              className="ve-input resize-none text-sm"
              placeholder="Tell the community about your picks strategy..."
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">Avatar URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="ve-input text-sm"
              placeholder="https://..."
            />
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="electric-button flex items-center gap-1.5 text-xs"
          >
            {saved ? <><Check className="w-3.5 h-3.5" /> Saved!</> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
          </button>
        </form>
      )}

      {/* Tab: Preferences */}
      {activeTab === "preferences" && (
        <form onSubmit={handleSave} className="ve-card p-5 space-y-4 animate-slide-up">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Picks Preferences</h3>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">Mode</label>
            <div className="flex gap-2">
              {(["beginner", "advanced"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all capitalize ${
                    mode === m
                      ? "bg-sky-950/60 text-sky-400 border-sky-800/50"
                      : "border-slate-700 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">
              Favorite Teams <span className="text-slate-600 normal-case">(comma separated)</span>
            </label>
            <input
              value={favoriteTeams}
              onChange={(e) => setFavoriteTeams(e.target.value)}
              className="ve-input text-sm"
              placeholder="Yankees, Dodgers, Cubs..."
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">
              Preferred Markets <span className="text-slate-600 normal-case">(comma separated)</span>
            </label>
            <input
              value={preferredMarkets}
              onChange={(e) => setPreferredMarkets(e.target.value)}
              className="ve-input text-sm"
              placeholder="Moneyline, Run Line, Over/Under..."
            />
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="electric-button flex items-center gap-1.5 text-xs"
          >
            {saved ? <><Check className="w-3.5 h-3.5" /> Saved!</> : <><Save className="w-3.5 h-3.5" /> Save Preferences</>}
          </button>
        </form>
      )}

      {/* Tab: Account */}
      {activeTab === "account" && (
        <div className="ve-card p-5 space-y-4 animate-slide-up">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Account Info</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-xs text-slate-400">Email</span>
              <span className="text-xs font-semibold text-slate-200">{me?.user?.email ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-xs text-slate-400">Plan</span>
              <span className="text-xs font-bold uppercase text-amber-400">{me?.plan ?? "FREE"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-xs text-slate-400">Vouch Level</span>
              <span className="text-xs font-bold capitalize text-sky-400">{me?.vouch_level ?? "unverified"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-xs text-slate-400">Trust Score</span>
              <span className="text-xs font-mono font-bold" style={{ color: "var(--ve-accent)" }}>{me?.trust_score ?? 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-slate-400">Age Verified</span>
              <span className={`text-xs font-bold ${profileData?.age_verified ? "text-emerald-400" : "text-slate-500"}`}>
                {profileData?.age_verified ? "Yes" : "No"}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[11px] text-slate-600">
              To change your email or password, contact support.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
