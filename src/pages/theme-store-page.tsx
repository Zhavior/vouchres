import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { themesApi } from "@/services/themes";
import { useThemeStore } from "@/stores/theme-store";
import { THEMES, getCategories, type VisualTheme } from "@/data/themes";
import { EmptyStateCard } from "@/components/ui-states";
import { LoadingCard } from "@/components/ui-states";
import { Sparkles, Check, Coins, Lock, RotateCcw, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeStorePage() {
  const [category, setCategory] = useState("All");
  const { activeThemeId, boughtThemes, themeCredits, buyTheme, activateTheme, deactivateTheme, grantCredits } = useThemeStore();
  const queryClient = useQueryClient();

  const myThemes = useQuery({
    queryKey: ["my-themes"],
    queryFn: () => themesApi.myThemes(),
    staleTime: 30_000,
  });

  const categories = getCategories();
  const filteredThemes = category === "All" ? THEMES : THEMES.filter((t) => t.category === category);

  const handleBuy = async (theme: VisualTheme) => {
    const success = await buyTheme(theme.id);
    if (success) {
      queryClient.invalidateQueries({ queryKey: ["my-themes"] });
    }
  };

  const handleActivate = async (themeId: string) => {
    await activateTheme(themeId);
    queryClient.invalidateQueries({ queryKey: ["my-themes"] });
  };

  const handleDeactivate = async () => {
    await deactivateTheme();
    queryClient.invalidateQueries({ queryKey: ["my-themes"] });
  };

  const handleGrantCredits = async () => {
    await grantCredits(500);
    queryClient.invalidateQueries({ queryKey: ["my-themes"] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-electric-400" />
            Theme Store
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Transform your profile. When others visit your page, they see your theme.
          </p>
        </div>

        {/* Credits */}
        <div className="ve-card px-4 py-2 flex items-center gap-3">
          <Coins className="w-5 h-5 text-yellow-400" />
          <div>
            <div className="text-lg font-bold font-mono text-yellow-400">{themeCredits}</div>
            <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Credits</div>
          </div>
          <button
            onClick={handleGrantCredits}
            className="ml-2 p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors"
            title="Grant 500 credits (beta)"
          >
            <Plus className="w-4 h-4 text-yellow-400" />
          </button>
        </div>
      </div>

      {/* Premium theme info banner */}
      <div className="mb-6 p-4 rounded-xl text-center" style={{ background: "linear-gradient(135deg, rgba(0,183,255,0.08) 0%, rgba(124,58,237,0.08) 100%)", border: "1px solid rgba(0,183,255,0.2)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--ve-accent)" }}>Unlock premium themes with VouchCoins or upgrade your membership</p>
        <p className="text-[11px] mt-1" style={{ color: "var(--ve-text-dim)" }}>New themes release monthly. Founder Mode is exclusive to original members.</p>
      </div>

      {/* Active theme banner */}
      <div className="ve-card p-4 border-electric-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Active Theme</div>
            <div className="text-lg font-bold text-electric-300 mt-0.5">
              {THEMES.find((t) => t.id === activeThemeId)?.name ?? "Default"}
            </div>
          </div>
          {activeThemeId !== "default" && (
            <button
              onClick={handleDeactivate}
              className="ghost-button text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Default
            </button>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
              category === cat
                ? "bg-electric-500/15 text-electric-300 border border-electric-500/40"
                : "text-slate-400 hover:text-electric-300 border border-transparent"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Theme grid */}
      {myThemes.isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <LoadingCard key={i} lines={5} className="ve-card p-4" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredThemes.map((theme) => {
            const isOwned = boughtThemes.includes(theme.id);
            const isActive = activeThemeId === theme.id;
            const canAfford = themeCredits >= theme.cost;

            return (
              <div
                key={theme.id}
                className={cn(
                  "rounded-2xl overflow-hidden border transition-all duration-300",
                  theme.card_style,
                  theme.border_color,
                  isActive && "ring-2 ring-electric-500 shadow-glow-strong"
                )}
              >
                {/* Theme preview area */}
                <div className={cn("h-24 bg-gradient-to-br relative overflow-hidden", theme.glow_color)}>
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute inset-0 flex items-center justify-center gap-1 text-2xl">
                    {theme.particle_demo.map((p, i) => (
                      <span
                        key={i}
                        className="animate-pulse"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  <div className={cn("absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider", theme.accent_text)}>
                    {theme.badge}
                  </div>
                  {isActive && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-electric-500 text-navy-950 text-[9px] font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      ACTIVE
                    </div>
                  )}
                </div>

                {/* Theme info */}
                <div className="p-3 space-y-2">
                  <div>
                    <h3 className={cn("text-sm font-bold", theme.accent_text)}>{theme.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{theme.description}</p>
                  </div>

                  {theme.custom_ai_phrase && (
                    <div className="text-[9px] text-slate-500 font-mono italic truncate">
                      {theme.custom_ai_phrase}
                    </div>
                  )}

                  {/* Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-xs font-mono font-bold text-yellow-400">
                        {theme.cost === 0 ? "FREE" : theme.cost}
                      </span>
                    </div>

                    {isActive ? (
                      <span className="text-[10px] text-electric-300 font-mono font-bold uppercase">✓ Active</span>
                    ) : isOwned ? (
                      <button
                        onClick={() => handleActivate(theme.id)}
                        className="px-3 py-1 rounded-lg text-[10px] font-bold bg-electric-500/15 text-electric-300 border border-electric-500/40 hover:bg-electric-500/25 transition-all"
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy(theme)}
                        disabled={!canAfford && theme.cost > 0}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all",
                          canAfford || theme.cost === 0
                            ? "bg-electric-500 text-navy-950 hover:shadow-glow"
                            : "bg-navy-800 text-slate-500 cursor-not-allowed"
                        )}
                      >
                        {theme.cost === 0 ? (
                          "Get Free"
                        ) : canAfford ? (
                          <>
                            <Coins className="w-3 h-3" />
                            Buy
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            {theme.cost}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
