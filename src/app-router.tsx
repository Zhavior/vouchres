import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/app-layout";
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
import { ThemeStorePage } from "@/pages/theme-store-page";
import { TermsOfServicePage } from "@/pages/terms-of-service-page";
import { PrivacyPolicyPage } from "@/pages/privacy-policy-page";
import { ResponsibleGamblingPage } from "@/pages/responsible-gambling-page";
import { PlaceholderPage } from "@/pages/placeholder-page";
import { useAuthStore } from "@/stores/auth-store";
import {
  Users, Bell, Settings, Shield, Activity, FileText, Lock, AlertTriangle, User as UserIcon,
} from "lucide-react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/live" element={<ProtectedRoute><LiveGamesPage /></ProtectedRoute>} />
          <Route path="/picks" element={<ProtectedRoute><AiPicksHubPage /></ProtectedRoute>} />
          <Route path="/parlays" element={<ProtectedRoute><ParlayLabPage /></ProtectedRoute>} />
          <Route path="/ledger" element={<ProtectedRoute><PickLedgerPage /></ProtectedRoute>} />
          <Route path="/feed" element={<ProtectedRoute><SocialFeedPage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/themes" element={<ProtectedRoute><ThemeStorePage /></ProtectedRoute>} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PlaceholderPage
                  title="User Profile"
                  description="Full profile with record, market breakdown, followers, and subscription options."
                  icon={UserIcon}
                  phase="Phase 12"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <PlaceholderPage
                  title="Capper Marketplace"
                  description="Buy paid picks from verified Gold+ cappers. Marketplace opens with Stripe Connect integration."
                  icon={Users}
                  phase="Live"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <PlaceholderPage
                  title="Settings"
                  description="Account, region, preferred markets, beginner/advanced mode, notification preferences."
                  icon={Settings}
                  phase="Phase 12"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <PlaceholderPage
                  title="Admin Dashboard"
                  description="Suspend users, approve cappers, void picks, review reports, view audit logs, manage feature flags."
                  icon={Shield}
                  phase="Live"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/health"
            element={
              <ProtectedRoute>
                <PlaceholderPage
                  title="System Health"
                  description="DB, Redis, MLB API, queue lag, model freshness."
                  icon={Activity}
                  phase="Live"
                />
              </ProtectedRoute>
            }
          />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/responsible-gambling" element={<ResponsibleGamblingPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
