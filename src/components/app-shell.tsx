/**
 * AppShell — premium layout with left sidebar + right rail + mobile bottom nav.
 */
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { CyberBackground } from "@/components/cyber-background";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import {
  Home, Swords, Sparkles, Layers, Trophy, Users, Bell, Settings,
  Shield, Palette, LogOut, ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/live", label: "Live Games", icon: Swords },
  { to: "/picks", label: "Trust Picks AI", icon: Sparkles },
  { to: "/parlays", label: "Parlay Lab", icon: Layers },
  { to: "/feed", label: "Vouch Feed", icon: Users },
  { to: "/ledger", label: "Results", icon: Trophy },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/themes", label: "Themes", icon: Palette },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
];

const MOBILE_NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/picks", label: "Picks", icon: Sparkles },
  { to: "/live", label: "Live", icon: Swords },
  { to: "/ledger", label: "Results", icon: Trophy },
  { to: "/feed", label: "Feed", icon: Users },
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
      className="hidden md:flex flex-col h-screen sticky top-0 w-[60px] xl:w-[220px] flex-shrink-0 border-r"
      style={{ background: "var(--ve-sidebar-bg)", borderColor: "var(--ve-card-border)", backdropFilter: "blur(16px)" }}
    >
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2.5 px-3 xl:px-4 py-4 cursor-pointer group">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-12"
          style={{ background: "var(--ve-badge-bg)", border: "1px solid var(--ve-badge-border)" }}>
          <svg viewBox="0 0 64 64" className="w-5 h-5">
            <path d="M32 8 L52 18 V38 L32 56 L12 38 V18 Z" stroke="var(--ve-accent)" strokeWidth="3" fill="none"/>
            <circle cx="32" cy="30" r="7" fill="var(--ve-accent)"/>
          </svg>
        </div>
        <span className="hidden xl:inline font-extrabold text-sm tracking-tight">
          Vouch<span style={{ color: "var(--ve-accent)" }}>Edge</span>
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-2 xl:px-3 space-y-1 overflow-y-auto scrollbar-none">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("ve-nav-link", isActive && "active")}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden xl:inline">{item.label}</span>
          </NavLink>
        ))}
        {me?.user?.role === "admin" && (
          <NavLink to="/admin" className={({ isActive }) => cn("ve-nav-link", isActive && "active")}>
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span className="hidden xl:inline">Admin</span>
          </NavLink>
        )}
      </nav>

      {/* User footer */}
      <div className="p-2 xl:p-3 border-t" style={{ borderColor: "var(--ve-card-border)" }}>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--ve-badge-bg)] transition-colors"
          onClick={() => { logout(); navigate("/"); }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "var(--ve-badge-bg)", color: "var(--ve-accent)", border: "1px solid var(--ve-badge-border)" }}>
            {me?.user?.username?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="hidden xl:block flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{me?.user?.username ? `@${me.user.username}` : "User"}</div>
            <div className="text-[10px]" style={{ color: "var(--ve-text-dim)" }}>Tap to logout</div>
          </div>
          <LogOut className="w-3.5 h-3.5 hidden xl:block" style={{ color: "var(--ve-text-dim)" }} />
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

      {/* Quick stats */}
      <div className="ve-card p-4 space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--ve-text-dim)" }}>Quick Stats</div>
        <div className="flex justify-between text-xs"><span style={{ color: "var(--ve-text-muted)" }}>Plan</span><span className="font-bold uppercase">{me?.plan ?? "FREE"}</span></div>
        <div className="flex justify-between text-xs"><span style={{ color: "var(--ve-text-muted)" }}>Vouch Level</span><span className="font-bold capitalize">{me?.vouch_level ?? "unverified"}</span></div>
      </div>

      {/* Proof message */}
      <div className="ve-card p-4 border-l-2" style={{ borderLeftColor: "var(--ve-accent)" }}>
        <p className="text-xs font-medium" style={{ color: "var(--ve-text-muted)" }}>
          "Sports picks need proof. Every pick gets graded."
        </p>
      </div>
    </>
  );
}

function MobileBottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-bottom flex items-stretch h-16 border-t"
      style={{ background: "var(--ve-sidebar-bg)", borderColor: "var(--ve-card-border)", backdropFilter: "blur(16px)" }}>
      {MOBILE_NAV.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all",
          isActive ? "" : "opacity-50")}
          style={({ isActive }) => isActive ? { color: "var(--ve-accent)" } : { color: "var(--ve-text-muted)" }}>
          {({ isActive }) => (
            <>
              <div className={cn("p-1.5 rounded-lg transition-all", isActive && "ve-pulse")} style={isActive ? { background: "var(--ve-badge-bg)" } : {}}>
                <item.icon className="w-5 h-5" />
              </div>
              {item.label}
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
