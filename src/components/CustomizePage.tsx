import React, { useState, useEffect } from "react";
import {
  Settings, Eye, EyeOff, ChevronUp, ChevronDown, RotateCcw,
  LayoutDashboard, Home, Trophy, Tv, Sliders, Cpu, Activity,
  Flame, ScanLine, Search, ClipboardCheck, BarChart3, Award, Sparkles,
  MessageSquare, ShoppingBag, User, Lock, Zap, Check,
} from "lucide-react";
import { CreatorProofProfile } from "../types";
import {
  FeatureLayout, ViewMode, loadFeatureLayout, saveFeatureLayout,
  toggleFeature, moveFeature, setViewMode, resetLayout, getDefaultLayout,
} from "../lib/featureConfig";
import { canAccessThemeStore } from "../lib/adminDevAccess";
import { getFounderPointsLabel } from "../lib/founderAccess";

/* ============================================================================
   CustomizePage — modular feature management
   ----------------------------------------------------------------------------
   Users can:
     - Toggle Beginner / Pro mode (changes data density globally)
     - Toggle features on/off (hide from sidebar)
     - Reorder features (up/down buttons)
     - Reset to defaults
   ============================================================================ */

interface Props {
  profile: CreatorProofProfile;
  onUpdateProfile: (updates: Partial<CreatorProofProfile>) => void;
  onSectionChange: (section: string) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy, LayoutDashboard, Home, Award, Tv, Sliders, Cpu, Activity,
  Flame, ScanLine, Search, ClipboardCheck, BarChart3, Sparkles,
  MessageSquare, ShoppingBag, User, Settings,
};

export default function CustomizePage({ profile, onUpdateProfile, onSectionChange }: Props) {
  const [layout, setLayout] = useState<FeatureLayout>(() => loadFeatureLayout());
  const [toast, setToast] = useState<string | null>(null);

  // Sync profile's view mode with layout
  useEffect(() => {
    saveFeatureLayout(layout);
  }, [layout]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleToggle = (featureId: string) => {
    setLayout((prev) => {
      const next = toggleFeature(prev, featureId);
      showToast(toggleFeature(prev, featureId).features.find((f) => f.id === featureId)?.enabled ? "Feature shown" : "Feature hidden");
      return next;
    });
  };

  const handleMove = (featureId: string, direction: "up" | "down") => {
    setLayout((prev) => moveFeature(prev, featureId, direction));
  };

  const handleModeChange = (mode: ViewMode) => {
    setLayout((prev) => {
      const next = setViewMode(prev, mode);
      showToast(`${mode === "pro" ? "Pro" : "Beginner"} mode active`);
      return next;
    });
  };

  const handleReset = () => {
    const def = resetLayout();
    setLayout(def);
    showToast("Reset to defaults");
  };

  const visibleFeatures = layout.features.filter((feature) => {
    return feature.access !== "admin_dev" || canAccessThemeStore(profile);
  });
  const sortedFeatures = [...visibleFeatures].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen pb-12" style={{ background: "#040810", color: "#e2e8f0" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #22d3ee, #2563eb)" }}>
            <LayoutDashboard className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Customize Layout</h1>
            <p className="text-xs text-slate-500">Toggle features, reorder sidebar, switch modes</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-bold text-white">View Mode</div>
              <div className="text-[11px] text-slate-500">
                {layout.mode === "pro"
                  ? "Pro: Full data — judge scores, risk warnings, advanced metrics, debug info"
                  : "Beginner: Clean views — risk pills, confidence levels, one-line reasons"}
              </div>
            </div>
          </div>
          <div className="flex p-0.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {([
              { id: "beginner" as ViewMode, label: "Beginner", icon: Eye },
              { id: "pro" as ViewMode, label: "Pro", icon: Zap },
            ]).map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  layout.mode === m.id ? "text-slate-950" : "text-slate-500 hover:text-slate-300"
                }`}
                style={layout.mode === m.id ? { background: "linear-gradient(135deg, #22d3ee, #2563eb)" } : {}}
              >
                <m.icon className="w-3.5 h-3.5" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature List */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Sidebar Features ({sortedFeatures.filter((f) => f.enabled).length} visible)</div>
            <button
              onClick={handleReset}
              className="text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-md text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="divide-y divide-white/3">
            {sortedFeatures.map((feature, index) => {
              const Icon = ICON_MAP[feature.icon] || Settings;
              const isFirst = index === 0;
              const isLast = index === sortedFeatures.length - 1;
              const prevLocked = index > 0 && sortedFeatures[index - 1].locked;
              const nextLocked = index < sortedFeatures.length - 1 && sortedFeatures[index + 1].locked;

              return (
                <div
                  key={feature.id}
                  className={`flex items-center gap-3 p-3 transition-all ${!feature.enabled ? "opacity-40" : ""}`}
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => handleMove(feature.id, "up")}
                      disabled={isFirst || (feature.locked && prevLocked)}
                      className="text-slate-600 hover:text-cyan-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(feature.id, "down")}
                      disabled={isLast || (feature.locked && nextLocked)}
                      className="text-slate-600 hover:text-cyan-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: feature.enabled ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.02)" }}>
                    <Icon className={`w-4 h-4 ${feature.enabled ? "text-cyan-400" : "text-slate-600"}`} />
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{feature.label}</div>
                    {feature.locked && (
                      <div className="flex items-center gap-1 text-[9px] text-slate-600">
                        <Lock className="w-2.5 h-2.5" /> Always visible
                      </div>
                    )}
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => !feature.locked && handleToggle(feature.id)}
                    disabled={feature.locked}
                    className={`relative w-10 h-5 rounded-full transition-all shrink-0 ${
                      feature.enabled ? "bg-cyan-500/30" : "bg-slate-700/50"
                    } ${feature.locked ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                        feature.enabled ? "left-5 bg-cyan-400" : "left-0.5 bg-slate-500"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pro mode preview */}
        <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">What changes in {layout.mode === "pro" ? "Pro" : "Beginner"} mode?</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {(layout.mode === "pro" ? [
              "Judge scores (0-100) on every pick",
              "Full whatCouldGoWrong list",
              "Missing data warnings",
              "Safer alternative suggestions",
              "4-judge panel breakdown",
              "Data confidence scores",
              "Advanced metrics (barrel%, exit velo, xwOBA)",
              "Raw API data + debug panels",
            ] : [
              "Risk pill (Safe/Balanced/Risky/Sneaky/Lotto)",
              "Confidence level (High/Med/Low)",
              "One-line reason per pick",
              "Clean stat tiles (AVG/HR/RBI/OPS)",
              "Simple game log timeline",
              "No judge internals or debug data",
              "Larger touch targets",
              "Clearer visual hierarchy",
            ]).map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-slate-400">
                <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={() => onSectionChange("settings")}
          className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Back to Settings
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(34,211,238,0.3)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
