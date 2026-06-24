/**
 * AppShell — premium layout with left sidebar + right rail + mobile bottom nav.
 */
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { CyberBackground } from "@/components/cyber-background";
import { ThemeProvider } from "@/components/theme-provider";
import { HotMarketsPanel } from "@/components/hot-markets-panel";
import { TrendingVouchesPanel } from "@/components/trending-vouches-panel";
import { ProofBuildersPanel } from "@/components/proof-builders-panel";
import { cn } from "@/lib/utils";
import {
  Home, Swords, Sparkles, Layers, Trophy, Users, Bell, Settings,
  Shield, Palette, LogOut, Target, ClipboardCheck, Search, Cpu,
  MessageSquare, ShoppingBag, User,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/live", label: "Live Games", icon: Swords },
  { to: "/picks", label: "V.A.I Picks", icon: Sparkles },
  { to: "/ai-picks", label: "AI Picks", icon: Target },
  { to: "/parlays", label: "Parlay Lab", icon: Layers },
  { to: "/vouch-board", label: "Vouch Board", icon: ClipboardCheck },
  { to: "/research", label: "Player Research", icon: Search },
  { to: "/feed", label: "Feed", icon: Users },
  { to: "/ledger", label: "Results", icon: Trophy },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/premium", label: "Premium", icon: Sparkles },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/themes", label: "Theme Store", icon: ShoppingBag },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

const MOBILE_NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/picks", label: "Picks", icon: Sparkles },
  { to: "/live", label: "Live", icon: Swords },
  { to: "/feed", label: "Feed", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
];

export function AppShell() {
  return (
    <ThemeProvider>
      <CyberBackground />
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <SidebarNav />
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-5xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
        {/* Right rail (desktop only) */}
        <RightRail />
        {/* Mobile bottom nav */}
        <MobileBottomNav />
      </div>
    </ThemeProvider>
  );
}

function SidebarNav() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const me = useAuthStore((s) => s.me);

  return (
    <aside
      className="hidden md:flex flex-col h-screen sticky top-0 w-[70px] xl:w-[260px] flex-shrink-0 border-r overflow-y-auto scrollbar-none justify-between select-none z-40"
      style={{ background: "rgba(9,13,22,0.95)", borderColor: "rgba(30,41,59,0.7)", backdropFilter: "blur(24px)" }}
    >
      <div className="space-y-4 py-5">
        {/* Star Wars VouchEdge Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 px-3 xl:px-4 relative group cursor-pointer" id="brand-logo-id">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[#FFE81F] font-extrabold text-base flex-shrink-0 transition-transform group-hover:rotate-12"
            style={{ background: "rgba(120,53,15,0.4)", border: "2px solid rgba(255,232,31,0.7)", boxShadow: "0 0 15px rgba(255,232,31,0.25)" }}>
            ★
          </div>
          <span className="hidden xl:inline starwars-font-crawl text-xl tracking-wider select-none leading-none">
            VOUCH<span className="starwars-font-solid">EDGE</span>
          </span>
        </Link>

        {/* Nav Items */}
        <nav className="px-2 xl:px-3 space-y-1" id="sidebar-nav-container">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-sm transition-all duration-200 border",
                isActive
                  ? "bg-sky-950/40 text-sky-400 border-sky-800/40 font-semibold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900 border-transparent"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-sky-400" : "text-slate-400")} />
                  <span className="hidden xl:inline truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
          {me?.user?.role === "admin" && (
            <NavLink to="/admin" className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-sm transition-all border",
              isActive ? "bg-sky-950/40 text-sky-400 border-sky-800/40" : "text-slate-400 hover:text-slate-100 hover:bg-slate-900 border-transparent"
            )}>
              {({ isActive }) => (
                <>
                  <Shield className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-sky-400" : "text-slate-400")} />
                  <span className="hidden xl:inline">Admin</span>
                </>
              )}
            </NavLink>
          )}
        </nav>

        {/* Build Parlay CTA */}
        <div className="px-3 pt-1">
          <Link to="/parlays"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #0ea5e9, #4f46e5)", boxShadow: "0 4px 16px rgba(14,165,233,0.3)" }}>
            <Layers className="w-4 h-4" />
            <span className="hidden xl:inline">Build Parlay</span>
          </Link>
        </div>
      </div>

      {/* User footer */}
      <div className="p-2 xl:p-3 border-t" style={{ borderColor: "rgba(30,41,59,0.7)" }}>
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl cursor-pointer hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-800"
          onClick={() => { logout(); navigate("/"); }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "var(--ve-badge-bg)", color: "var(--ve-accent)", border: "1px solid var(--ve-badge-border)" }}>
            {me?.user?.username?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="hidden xl:block flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">{me?.user?.username ? `@${me.user.username}` : "User"}</div>
            <div className="text-[10px] flex items-center gap-1" style={{ color: "var(--ve-text-dim)" }}>
              <LogOut className="w-3 h-3" /> Tap to logout
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  const me = useAuthStore((s) => s.me);
  return (
    <header className="sticky top-0 z-30 md:hidden flex items-center justify-between px-4 h-14 border-b"
      style={{ background: "var(--ve-sidebar-bg)", borderColor: "var(--ve-card-border)", backdropFilter: "blur(16px)" }}>
      <Link to="/dashboard" className="flex items-center gap-2">
        <svg viewBox="0 0 64 64" className="w-6 h-6">
          <path d="M32 8 L52 18 V38 L32 56 L12 38 V18 Z" stroke="var(--ve-accent)" strokeWidth="3" fill="none"/>
          <circle cx="32" cy="30" r="7" fill="var(--ve-accent)"/>
        </svg>
        <span className="font-extrabold text-sm">Vouch<span style={{ color: "var(--ve-accent)" }}>Edge</span></span>
      </Link>
      <div className="flex items-center gap-2">
        {me && <span className="text-xs" style={{ color: "var(--ve-text-muted)" }}>@{me.user.username}</span>}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
          style={{ background: "var(--ve-badge-bg)", color: "var(--ve-accent)", border: "1px solid var(--ve-badge-border)" }}>
          {me?.user?.username?.charAt(0).toUpperCase() ?? "?"}
        </div>
      </div>
    </header>
  );
}

function RightRail() {
  return (
    <aside className="hidden xl:flex flex-col w-[300px] flex-shrink-0 h-screen sticky top-0 p-4 gap-4 overflow-y-auto scrollbar-none border-l"
      style={{ borderColor: "var(--ve-card-border)" }}>
      <RightRailContent />
    </aside>
  );
}

export function RightRailContent() {
  const me = useAuthStore((s) => s.me);
  return (
    <>
      {/* Trust score card */}
      <div className="ve-card p-4">
        <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: "var(--ve-text-dim)" }}>Your Trust</div>
        <div className="flex items-center gap-3">
          <TrustScoreRing score={me?.trust_score ?? 0} size={56} />
          <div>
            <div className="text-2xl font-bold font-mono" style={{ color: "var(--ve-accent)" }}>{me?.trust_score ?? 0}</div>
            <div className="text-xs capitalize" style={{ color: "var(--ve-text-muted)" }}>{me?.vouch_level ?? "unverified"}</div>
          </div>
        </div>
      </div>

      {/* Hot Markets Panel */}
      <HotMarketsPanel />

      {/* Trending Vouches Panel */}
      <TrendingVouchesPanel />

      {/* Proof Builders Panel */}
      <ProofBuildersPanel />

      {/* Responsible gaming disclaimer */}
      <div className="ve-card p-4 border-l-2" style={{ borderLeftColor: "var(--ve-accent)" }}>
        <p className="text-xs font-medium" style={{ color: "var(--ve-text-muted)" }}>
          "Sports picks need proof. Every pick gets graded. Gamble responsibly."
        </p>
      </div>
    </>
  );
}

function MobileBottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom flex items-stretch border-t"
      style={{
        background: "rgba(9,13,22,0.95)",
        borderColor: "rgba(30,41,59,0.8)",
        backdropFilter: "blur(24px)",
        height: "64px",
      }}
    >
      {MOBILE_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cn(
            "flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all",
            isActive ? "text-sky-400" : "text-slate-500"
          )}
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "w-10 h-7 flex items-center justify-center rounded-xl transition-all",
                isActive ? "bg-sky-950/60" : ""
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/** TrustScoreRing — circular progress ring */
export function TrustScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 1000, 1);
  const offset = circumference - pct * circumference;
  const color = score >= 600 ? "var(--ve-success)" : score >= 300 ? "var(--ve-accent)" : "var(--ve-text-dim)";

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--ve-card-border)" strokeWidth="3" />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 0.5s ease" }} />
    </svg>
  );
}
