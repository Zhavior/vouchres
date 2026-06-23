import { NavLink, Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  LayoutDashboard, Swords, Sparkles, Layers, Trophy, Users, Bell, Settings, Palette,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/live", label: "Live", icon: Swords },
  { to: "/picks", label: "AI Picks", icon: Sparkles },
  { to: "/parlays", label: "Parlay Lab", icon: Layers },
  { to: "/ledger", label: "Ledger", icon: Trophy },
  { to: "/feed", label: "Feed", icon: Users },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/marketplace", label: "Cappers", icon: Users },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/themes", label: "Themes", icon: Palette },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function TopNav() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const me = useAuthStore((s) => s.me);

  return (
    <header className="sticky top-0 z-40 bg-navy-950/70 backdrop-blur-2xl border-b border-electric-500/10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-navy-900 border border-electric-500/30 flex items-center justify-center group-hover:border-electric-500/60 transition-all group-hover:rotate-12">
            <svg viewBox="0 0 64 64" className="w-5 h-5">
              <path d="M32 8 L52 18 V38 L32 56 L12 38 V18 Z" stroke="#00D4FF" strokeWidth="3" fill="rgba(0,212,255,0.08)"/>
              <circle cx="32" cy="30" r="7" fill="#00D4FF"/>
            </svg>
          </div>
          <span className="text-sm font-extrabold tracking-tight">
            Vouch<span className="text-electric-400 text-glow">Edge</span>
            <span className="text-slate-500 ml-1 text-[10px] font-mono">MLB</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn("nav-link", isActive && "nav-link-active")
              }
            >
              <span className="flex items-center gap-1.5">
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {me && (
                <span className="hidden lg:inline text-xs text-slate-400 font-mono">
                  @{me.user.username}
                </span>
              )}
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="ghost-button text-xs !px-3 !py-1.5"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden md:inline-flex ghost-button text-xs !px-3 !py-1.5">
                Sign in
              </Link>
              <Link to="/signup" className="hidden md:inline-flex electric-button text-xs !px-3 !py-1.5">
                Get Started
              </Link>
              <Link to="/signup" className="md:hidden electric-button text-xs !px-3 !py-1.5">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const MOBILE_NAV: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/picks", label: "Picks", icon: Sparkles },
  { to: "/live", label: "Live", icon: Swords },
  { to: "/ledger", label: "Ledger", icon: Trophy },
  { to: "/feed", label: "Feed", icon: Users },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy-950/90 backdrop-blur-2xl border-t border-electric-500/15 safe-bottom">
      <div className="flex items-stretch justify-around h-16">
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all",
                isActive ? "text-electric-300" : "text-slate-500"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "p-1.5 rounded-lg transition-all",
                  isActive && "bg-electric-500/10 shadow-glow"
                )}>
                  <item.icon className="w-5 h-5" />
                </div>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
