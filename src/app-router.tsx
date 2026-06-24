import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { LandingPage } from "@/pages/landing-page";
import { LoginPage } from "@/pages/login-page";
import { SignupPage } from "@/pages/signup-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { LiveGamesPage } from "@/pages/live-games-page";
import { AiPicksHubPage } from "@/pages/ai-picks-hub-page";
import { ParlayLabPage } from "@/pages/parlay-lab-page";
import { PickLedgerPage } from "@/pages/pick-ledger-page";
import { SocialFeedPage } from "@/pages/social-feed-page";
import { LeaderboardPage } from "@/pages/leaderboard-page";
import { NotificationsPage } from "@/pages/notifications-page";
import { TodaysAIPicksPage } from "@/pages/todays-ai-picks-page";
import { ThemeStorePage } from "@/pages/theme-store-page";
import { TermsOfServicePage } from "@/pages/terms-of-service-page";
import { PrivacyPolicyPage } from "@/pages/privacy-policy-page";
import { ResponsibleGamblingPage } from "@/pages/responsible-gambling-page";
import { PlaceholderPage } from "@/pages/placeholder-page";
import { ProfilePage } from "@/pages/profile-page";
import { SettingsPage } from "@/pages/settings-page";
import { SubscriberHubPage } from "@/pages/subscriber-hub-page";
import { VouchBoardPage } from "@/pages/vouch-board-page";
import { PlayerResearchPage } from "@/pages/player-research-page";
import { useAuthStore } from "@/stores/auth-store";
import { Users, Settings, Shield, User as UserIcon } from "lucide-react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const me = useAuthStore((s) => s.me);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isAuthenticated && !me) {
      fetchMe().finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, me, fetchMe]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (checking) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--ve-bg)" }}>
      <div className="ve-spinner" />
    </div>
  );
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/live" element={<ProtectedRoute><LiveGamesPage /></ProtectedRoute>} />
          <Route path="/picks" element={<ProtectedRoute><AiPicksHubPage /></ProtectedRoute>} />
          <Route path="/parlays" element={<ProtectedRoute><ParlayLabPage /></ProtectedRoute>} />
          <Route path="/ledger" element={<ProtectedRoute><PickLedgerPage /></ProtectedRoute>} />
          <Route path="/feed" element={<ProtectedRoute><SocialFeedPage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/ai-picks" element={<ProtectedRoute><TodaysAIPicksPage /></ProtectedRoute>} />
          <Route path="/themes" element={<ProtectedRoute><ThemeStorePage /></ProtectedRoute>} />
          <Route path="/vouch-board" element={<ProtectedRoute><VouchBoardPage /></ProtectedRoute>} />
          <Route path="/research" element={<ProtectedRoute><PlayerResearchPage /></ProtectedRoute>} />
          <Route path="/premium" element={<ProtectedRoute><SubscriberHubPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><PlaceholderPage title="Admin" description="User management, pick moderation, trust review." icon={Shield} phase="Admin only" /></ProtectedRoute>} />
          <Route path="/marketplace" element={<ProtectedRoute><PlaceholderPage title="Marketplace" description="Buy paid picks from verified cappers." icon={Users} phase="Live" /></ProtectedRoute>} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/responsible-gambling" element={<ResponsibleGamblingPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
