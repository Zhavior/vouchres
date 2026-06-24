/**
 * ProfilePage — Premium dark profile with activity heatmap, avatar, edit mode, follow counts.
 * Uses useAuthStore for user data and profileApi for save operations.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, ShieldCheck, Edit3, Save, X, Calendar, Users } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { profileApi } from "@/services/profile";
import { TrustScoreRing } from "@/components/app-shell";

export function ProfilePage() {
  const me = useAuthStore((s) => s.me);
  const qc = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.get(),
    enabled: !!me,
  });

  const { data: followingData } = useQuery({
    queryKey: ["following"],
    queryFn: () => profileApi.following(),
    enabled: !!me,
  });

  const { data: followersData } = useQuery({
    queryKey: ["followers"],
    queryFn: () => profileApi.followers(),
    enabled: !!me,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const updateMutation = useMutation({
    mutationFn: profileApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      setIsEditing(false);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      bio: bio || undefined,
      avatar_url: avatarUrl || undefined,
    });
  };

  const handleEditStart = () => {
    setBio(profileData?.bio ?? "");
    setAvatarUrl(profileData?.avatar_url ?? "");
    setIsEditing(true);
  };

  const username = me?.user?.username ?? "Guest";
  const trustScore = me?.trust_score ?? 0;
  const vouchLevel = me?.vouch_level ?? "unverified";
  const plan = me?.plan ?? "FREE";

  // Activity heatmap — last 10 weeks (70 days) placeholder grid
  // TODO: Replace with real /v1/me/activity endpoint when available
  const heatmapDays = Array.from({ length: 70 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (69 - i));
    return { date: d.toISOString().slice(0, 10), level: Math.floor(Math.random() * 4) };
  });

  const heatmapColors = ["bg-slate-800", "bg-sky-900/60", "bg-sky-700/70", "bg-sky-500/80"];

  const followingCount = Array.isArray(followingData) ? followingData.length : 0;
  const followersCount = Array.isArray(followersData) ? followersData.length : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-sky-400" />
        <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider">Profile & Proof Hub</h2>
      </div>

      {/* Main profile card */}
      <div className="ve-card overflow-hidden animate-slide-up">
        {/* Cover gradient */}
        <div className="h-24 bg-gradient-to-r from-sky-600/30 to-indigo-600/30 relative">
          {/* Avatar */}
          <div className="absolute -bottom-10 left-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black border-4 border-[#090d16]"
                style={{ background: "var(--ve-badge-bg)", color: "var(--ve-accent)" }}>
                {profileData?.avatar_url ? (
                  <img src={profileData.avatar_url} alt={username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  username.charAt(0).toUpperCase()
                )}
              </div>
              {/* Trust ring overlay */}
              <div className="absolute -bottom-1 -right-1">
                <TrustScoreRing score={trustScore} size={28} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 px-6 pb-6 space-y-4">
          {/* Name row */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-100">@{username}</h3>
                {vouchLevel !== "unverified" && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-800/50 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 capitalize mt-0.5">{vouchLevel} · {plan} plan</p>
            </div>
            <button
              onClick={isEditing ? () => setIsEditing(false) : handleEditStart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
            >
              {isEditing ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Edit3 className="w-3.5 h-3.5" /> Edit</>}
            </button>
          </div>

          {/* Follow counts */}
          <div className="flex gap-6">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="font-bold text-slate-200 text-sm">{followersCount}</span>
              <span className="text-xs text-slate-500">followers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-200 text-sm">{followingCount}</span>
              <span className="text-xs text-slate-500">following</span>
            </div>
          </div>

          {/* Bio / Edit form */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-3">
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
                <Save className="w-3.5 h-3.5" />
                {updateMutation.isPending ? "Saving..." : "Save Profile"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-slate-400 leading-relaxed">
              {profileData?.bio || "No bio yet. Click Edit to add your picks strategy."}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up">
        <div className="ve-card p-4 text-center">
          <div className="text-2xl font-black font-mono" style={{ color: "var(--ve-accent)" }}>{trustScore}</div>
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Trust Score</div>
        </div>
        <div className="ve-card p-4 text-center">
          <div className="text-2xl font-black font-mono text-emerald-400">{plan}</div>
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Plan</div>
        </div>
        <div className="ve-card p-4 text-center">
          <div className="text-2xl font-black font-mono text-amber-400 capitalize">{vouchLevel}</div>
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Vouch Level</div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="ve-card p-4 animate-slide-up">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Activity — Last 10 Weeks</span>
          <span className="ml-auto text-[10px] text-slate-600">TODO: wire /v1/me/activity</span>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
          {heatmapDays.map((day) => (
            <div
              key={day.date}
              title={day.date}
              className={`w-full aspect-square rounded-sm ${heatmapColors[day.level]} cursor-pointer hover:opacity-80 transition-opacity`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 justify-end">
          <span className="text-[10px] text-slate-600">Less</span>
          {heatmapColors.map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span className="text-[10px] text-slate-600">More</span>
        </div>
      </div>

      {/* Preferred markets / teams from profile */}
      {(profileData?.preferred_markets?.length || profileData?.favorite_teams?.length) ? (
        <div className="ve-card p-4 space-y-3 animate-slide-up">
          {profileData.favorite_teams?.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">Favorite Teams</div>
              <div className="flex flex-wrap gap-2">
                {profileData.favorite_teams.map((t) => (
                  <span key={t} className="ve-badge">{t}</span>
                ))}
              </div>
            </div>
          )}
          {profileData.preferred_markets?.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">Preferred Markets</div>
              <div className="flex flex-wrap gap-2">
                {profileData.preferred_markets.map((m) => (
                  <span key={m} className="ve-badge">{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
