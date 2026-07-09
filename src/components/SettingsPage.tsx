import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Loader,
  Lock,
  Mail,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { CreatorProofProfile } from '../types';
import { apiClient } from '../lib/apiClient';
import { VEButton } from './ui/ve';
import { supabase } from '../lib/supabaseClient';
import {
  fetchBillingStatus,
  openBillingPortal,
  startStripeCheckout,
  tierToSubscriptionTier,
} from '../lib/billingClient';
import { Z8_ACTIVE, Z8_IDLE, Z8_LABEL, Z8_PAGE, Z8_PAGE_PAD_X, Z8_PAGE_PAD_Y, Z8_PANEL_PREMIUM, Z8_SECTION_HEADER, Z8_STAT_CHIP, Z8_SURFACE } from '../theme/z8Tokens';

interface SettingsPageProps {
  onResetDatabase: () => void;
  profileName: string;
  profile: CreatorProofProfile & {
    twitter?: string;
    discord?: string;
    telegram?: string;
    twitch?: string;
    customTitle?: string;
  };
  onUpdateProfile: (updated: Partial<CreatorProofProfile>) => void;
}

type SettingsTab = 'account' | 'billing' | 'notifications' | 'privacy';
type AppTier = 'BASIC' | 'GOLD' | 'SELLER_PRO';

const PLAN_COPY: Record<AppTier, { title: string; price: string; detail: string; badge?: string }> = {
  BASIC: {
    title: 'Free',
    price: '$0',
    detail: 'Core MLB research, saved slips, and account tools.',
  },
  GOLD: {
    title: 'Gold',
    price: '$12.99',
    detail: 'Pro labs, advanced graphs, and verified profile perks.',
    badge: 'Popular',
  },
  SELLER_PRO: {
    title: 'Seller Pro',
    price: '$49.99',
    detail: 'Everything in Gold plus subscriber clubs and creator storefront.',
    badge: 'Elite',
  },
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeTier(tier?: string | null): AppTier {
  const t = String(tier ?? '').trim().toUpperCase();
  if (t === 'GOLD') return 'GOLD';
  if (t === 'SELLER_PRO' || t === 'SELLER PRO' || t === 'PRO') return 'SELLER_PRO';
  return 'BASIC';
}

// Toggle switch component
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${
        checked ? 'bg-blue-500' : 'bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// Section container
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// Divider
function Divider() {
  return <hr className="my-8 border-slate-800" />;
}

// Row for preference toggles
function PrefRow({
  label,
  detail,
  children,
}: {
  label: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-8 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage({
  onResetDatabase,
  profileName,
  profile,
  onUpdateProfile,
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [displayName, setDisplayName] = useState(profile.displayName || profileName || '');
  const [username, setUsername] = useState(profile.username || '');
  const [customTitle, setCustomTitle] = useState(profile.customTitle || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [twitter, setTwitter] = useState(profile.twitter || '');
  const [discord, setDiscord] = useState(profile.discord || '');
  const [telegram, setTelegram] = useState(profile.telegram || '');

  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('vouchedge_email_alerts') !== 'false');
  const [pushAlerts, setPushAlerts] = useState(() => localStorage.getItem('vouchedge_push_alerts') !== 'false');
  const [weeklySummary, setWeeklySummary] = useState(() => localStorage.getItem('vouchedge_weekly_summary') !== 'false');
  const [profilePublic, setProfilePublic] = useState(() => localStorage.getItem('vouchedge_profile_public') !== 'false');
  const [reduceMotion, setReduceMotion] = useState(Boolean(profile.reduceMotion));

  const [checkoutLoading, setCheckoutLoading] = useState<AppTier | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [billingStatus, setBillingStatus] = useState<{
    tier: 'free' | 'gold' | 'seller_pro';
    status: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  } | null>(null);

  const [privacyLoading, setPrivacyLoading] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [billingPortalError, setBillingPortalError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const activeTier = normalizeTier(profile.subscriptionTier);

  const nav: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'account', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
  ];

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    localStorage.setItem('vouchedge_email_alerts', String(emailAlerts));
    localStorage.setItem('vouchedge_push_alerts', String(pushAlerts));
    localStorage.setItem('vouchedge_weekly_summary', String(weeklySummary));
    localStorage.setItem('vouchedge_profile_public', String(profilePublic));
  }, [emailAlerts, pushAlerts, weeklySummary, profilePublic]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success') return;
    refreshBilling('Payment complete — your plan is updating.');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    } catch { /* cosmetic */ }
  }, []);

  const refreshBilling = async (message?: string) => {
    setBillingLoading(true);
    const status = await fetchBillingStatus();
    setBillingLoading(false);
    if (!status) {
      showToast('Billing status unavailable — sign in and configure Stripe.', 'err');
      return;
    }
    setBillingStatus(status);
    const nextTier = tierToSubscriptionTier(status.tier);
    onUpdateProfile({ subscriptionTier: nextTier, verified: nextTier !== 'BASIC' });
    showToast(message ?? 'Billing status refreshed.');
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      displayName: displayName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      reduceMotion,
      twitter: twitter.trim(),
      discord: discord.trim(),
      telegram: telegram.trim(),
      customTitle: customTitle.trim(),
    } as any);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
    showToast('Profile saved.');
  };

  const handleUpgrade = async (tier: AppTier) => {
    if (tier === 'BASIC') { await handleManageBilling(); return; }
    setCheckoutLoading(tier);
    const result = await startStripeCheckout(tier === 'GOLD' ? 'gold' : 'seller_pro');
    setCheckoutLoading(null);
    if (result.ok) {
      window.location.href = result.url;
      return;
    }

    const checkoutError = "error" in result ? result.error : "Unknown checkout error";
    showToast(`Checkout failed: ${checkoutError}`, 'err');
  };

  const handleManageBilling = async () => {
    setBillingPortalError(null);
    setPortalLoading(true);
    const result = await openBillingPortal();
    setPortalLoading(false);
    if (result.ok) {
      window.location.href = result.url;
      return;
    }

    // Map known error codes to readable messages
    const raw = "error" in result ? result.error ?? "" : "";
    let msg: string;
    if (raw === 'unauthorized' || raw.includes('unauthorized')) {
      msg = 'You must be signed in to manage billing.';
    } else if (raw.includes('portal_not_configured') || raw.includes('not_configured')) {
      msg = 'Stripe Billing Portal is not set up yet. Activate it in your Stripe Dashboard → Settings → Billing → Customer portal.';
    } else if (raw.includes('stripe_not_configured')) {
      msg = 'Stripe is not configured on this server.';
    } else {
      msg = raw || 'Could not open the billing portal. Please try again.';
    }
    setBillingPortalError(msg);
  };

  const handleExportData = async () => {
    setPrivacyLoading('export');
    try {
      const data = await apiClient.get('/api/privacy/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `vouchedge-export-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
      showToast('Data export downloaded.');
    } catch (err: any) {
      showToast(err?.message || 'Export unavailable — sign in first.', 'err');
    } finally {
      setPrivacyLoading(null);
    }
  };

  const handleScheduleDeletion = async () => {
    if (!window.confirm('Schedule account deletion? You have 30 days to cancel. Active subscriptions will be cancelled.')) return;
    setPrivacyLoading('delete');
    try {
      const result = await apiClient.post<{ deletion_scheduled_at?: string; message?: string }>(
        '/api/privacy/delete-account', { confirm: 'DELETE MY ACCOUNT' }
      );
      showToast(result.message || `Deletion scheduled for ${formatDate(result.deletion_scheduled_at)}.`, 'err');
    } catch (err: any) {
      showToast(err?.message || 'Unavailable — sign in first.', 'err');
    } finally {
      setPrivacyLoading(null);
    }
  };

  const handleResetClick = () => {
    if (!window.confirm('Reset all local picks, slips, vouches, and profile data on this device?')) return;
    onResetDatabase();
    showToast('Local data reset.');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password updated successfully.');
  };

  const initials = (displayName || username || 'VE').slice(0, 2).toUpperCase();

  return (
    <div className={`relative ${Z8_PAGE}`}>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur ${
          toast.type === 'ok'
            ? 'border-white/10 bg-black/80 text-white'
            : 'border-red-500/40 bg-red-950/80 text-red-200'
        }`}>
          {toast.type === 'ok'
            ? <Check className="h-4 w-4 shrink-0 text-vouch-emerald" />
            : <Zap className="h-4 w-4 shrink-0 text-red-400" />}
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="border-b border-white/10 bg-obsidian-900/95 px-6 py-5">
        <div className="mx-auto max-w-5xl">
          <div className={`flex items-center gap-2 text-xs font-medium text-white/40 ${Z8_LABEL}`}>
            <Settings className="h-3.5 w-3.5" />
            Settings
          </div>
          <h1 className="mt-1 text-xl font-semibold text-white">Account settings</h1>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex gap-10">

          {/* ─── Left sidebar nav ─── */}
          <nav className="w-48 shrink-0">
            <ul className="space-y-0.5">
              {nav.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => { setActiveTab(id); setBillingPortalError(null); }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      activeTab === id
                        ? `${Z8_ACTIVE} font-medium`
                        : `${Z8_IDLE}`
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Plan badge */}
            <div className={`mt-8 rounded-xl ${Z8_PANEL_PREMIUM} p-3`}>
              <p className={`${Z8_LABEL} text-white/35`}>Current plan</p>
              <p className="mt-1 text-sm font-semibold text-white">{PLAN_COPY[activeTier].title}</p>
              <p className="text-xs text-slate-500">{PLAN_COPY[activeTier].price}{activeTier !== 'BASIC' ? '/mo' : ''}</p>
              {activeTier === 'BASIC' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('billing')}
                  className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-500 transition-colors"
                >
                  Upgrade <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </nav>

          {/* ─── Main content ─── */}
          <div className="min-w-0 flex-1">

            {/* ── ACCOUNT ── */}
            {activeTab === 'account' && (
              <>
              <form onSubmit={handleProfileSave} className="space-y-8">

                {/* Avatar + name */}
                <Section title="Profile" subtitle="This is your public identity on VouchEdge.">
                  <div className={`${Z8_SURFACE} flex items-center gap-4 rounded-xl p-5`}>
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-bold text-white">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{displayName || 'Display name'}</p>
                      <p className="text-xs text-slate-500">@{username || 'username'}</p>
                      <p className="mt-1 text-xs text-slate-600">{customTitle || 'No title set'}</p>
                    </div>
                  </div>
                </Section>

                <Divider />

                {/* Fields */}
                <Section title="General" subtitle="Update your display name, username, and bio.">
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400">Display name</label>
                        <input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-vouch-cyan focus:ring-1 focus:ring-vouch-cyan/30"
                          placeholder="Your name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400">Username</label>
                        <div className="flex rounded-lg border border-slate-700 bg-slate-900 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30">
                          <span className="flex items-center pl-3 text-sm text-slate-600">@</span>
                          <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder-slate-600 outline-none"
                            placeholder="username"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Profile title</label>
                      <input
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                        placeholder="e.g. MLB Researcher"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400">Bio</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        maxLength={180}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                        placeholder="Short bio (max 180 chars)"
                      />
                      <p className="text-right text-[10px] text-slate-600">{bio.length}/180</p>
                    </div>
                  </div>
                </Section>

                <Divider />

                {/* Socials */}
                <Section title="Social links" subtitle="Connect your public profiles and channels.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { key: 'twitter', label: 'X (Twitter)', placeholder: '@handle', value: twitter, set: setTwitter },
                      { key: 'discord', label: 'Discord', placeholder: 'server or username', value: discord, set: setDiscord },
                      { key: 'telegram', label: 'Telegram', placeholder: '@channel', value: telegram, set: setTelegram },
                    ].map(({ key, label, placeholder, value, set }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400">{label}</label>
                        <input
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-vouch-cyan focus:ring-1 focus:ring-vouch-cyan/30"
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </Section>

                <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-6">
                  <button
                    type="submit"
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      profileSaved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                  >
                    {profileSaved ? <Check className="h-4 w-4" /> : null}
                    {profileSaved ? 'Saved' : 'Save changes'}
                  </button>
                </div>
              </form>

              {/* ── Security / Change Password (separate form so Enter doesn't submit profile) ── */}
              <div className="mt-10 border-t border-slate-800 pt-8">
                <Section
                  title="Security"
                  subtitle="Update your password. You must be signed in to change it."
                >
                  <form onSubmit={handleChangePassword} className="space-y-4" autoComplete="new-password">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400">New password</label>
                        <div className="flex rounded-lg border border-slate-700 bg-slate-900 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30">
                          <input
                            type={showNewPw ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                            autoComplete="new-password"
                            placeholder="Min. 8 characters"
                            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-600 outline-none"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowNewPw((v) => !v)}
                            className="flex items-center pr-3 text-slate-600 hover:text-slate-400 transition-colors"
                            aria-label={showNewPw ? 'Hide password' : 'Show password'}
                          >
                            {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400">Confirm password</label>
                        <div className="flex rounded-lg border border-slate-700 bg-slate-900 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/30">
                          <input
                            type={showConfirmPw ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                            autoComplete="new-password"
                            placeholder="Repeat new password"
                            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-600 outline-none"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowConfirmPw((v) => !v)}
                            className="flex items-center pr-3 text-slate-600 hover:text-slate-400 transition-colors"
                            aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Strength hint */}
                    {newPassword.length > 0 && newPassword.length < 8 && (
                      <p className="text-xs text-amber-400">
                        {8 - newPassword.length} more character{8 - newPassword.length !== 1 ? 's' : ''} needed
                      </p>
                    )}

                    {/* Inline error */}
                    {passwordError && (
                      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2.5">
                        <Lock className="h-3.5 w-3.5 shrink-0 text-red-400" />
                        <p className="text-xs text-red-300">{passwordError}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={passwordLoading || newPassword.length < 8 || newPassword !== confirmPassword}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
                      >
                        {passwordLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                        Update password
                      </button>
                    </div>
                  </form>
                </Section>
              </div>
              </>
            )}

            {/* ── BILLING ── */}
            {activeTab === 'billing' && (
              <div className="space-y-8">

                <Section title="Subscription" subtitle="Manage your plan and payment method.">

                  {/* Current plan row */}
                  <div className={`${Z8_SURFACE} flex items-center justify-between rounded-xl px-5 py-4`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{PLAN_COPY[activeTier].title} plan</p>
                        <p className="text-xs text-slate-500">
                          {billingStatus ? `Renews ${formatDate(billingStatus.currentPeriodEnd)}` : PLAN_COPY[activeTier].price + (activeTier !== 'BASIC' ? '/month' : ' forever')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        activeTier === 'BASIC' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/15 text-emerald-400'
                      }`}>
                        {activeTier === 'BASIC' ? 'Free' : 'Active'}
                      </span>
                      <button
                        type="button"
                        onClick={() => refreshBilling()}
                        disabled={billingLoading}
                        className="flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-900 hover:text-slate-200 disabled:opacity-50 transition-colors"
                      >
                        {billingLoading ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* Plan cards */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(Object.keys(PLAN_COPY) as AppTier[]).map((tier) => {
                      const plan = PLAN_COPY[tier];
                      const isActive = activeTier === tier;
                      const isLoading = checkoutLoading === tier;
                      return (
                        <div
                          key={tier}
                          className={`relative rounded-xl border p-4 transition-colors ${
                            isActive
                              ? 'border-blue-500/50 bg-blue-500/5'
                              : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                          }`}
                        >
                          {plan.badge && !isActive && (
                            <span className="absolute right-3 top-3 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                              {plan.badge}
                            </span>
                          )}
                          {isActive && (
                            <span className="absolute right-3 top-3 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                              Current
                            </span>
                          )}

                          <p className="text-sm font-semibold text-white">{plan.title}</p>
                          <p className="mt-1 text-2xl font-bold text-white">
                            {plan.price}
                            {tier !== 'BASIC' && <span className="text-sm font-normal text-slate-500">/mo</span>}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-slate-500">{plan.detail}</p>

                          <button
                            type="button"
                            disabled={isActive || isLoading}
                            onClick={() => handleUpgrade(tier)}
                            className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
                              isActive
                                ? 'cursor-default bg-slate-800 text-slate-600'
                                : tier === 'BASIC'
                                  ? 'border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                  : 'bg-blue-600 text-white hover:bg-blue-500'
                            }`}
                          >
                            {isLoading && <Loader className="h-3 w-3 animate-spin" />}
                            {isActive
                              ? 'Your plan'
                              : tier === 'BASIC'
                                ? 'Downgrade'
                                : activeTier !== 'BASIC'
                                  ? `Switch to ${plan.title}`
                                  : `Upgrade to ${plan.title}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </Section>

                <Divider />

                <Section title="Payment method" subtitle="Update your card, view invoices, or cancel your subscription.">
                  <div className="space-y-3">
                    <VEButton
                      type="button"
                      onClick={handleManageBilling}
                      disabled={portalLoading}
                      variant="ghost"
                      className="border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800 hover:text-white"
                    >
                      {portalLoading ? <Loader className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      Manage billing
                      <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                    </VEButton>
                    {billingPortalError && (
                      <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3">
                        <Zap className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-red-300">Billing portal unavailable</p>
                          <p className="mt-0.5 text-xs text-red-400/80">{billingPortalError}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBillingPortalError(null)}
                          className="ml-auto shrink-0 text-red-500/60 hover:text-red-400 transition-colors"
                          aria-label="Dismiss"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </Section>
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <Section title="Email" subtitle="Control which emails VouchEdge sends to you.">
                  <div className="divide-y divide-slate-800 rounded-xl border border-slate-800">
                    <PrefRow label="Account alerts" detail="Security and billing notifications.">
                      <Toggle checked={emailAlerts} onChange={setEmailAlerts} />
                    </PrefRow>
                    <PrefRow label="Weekly recap" detail="A summary of your picks, results, and activity each week.">
                      <Toggle checked={weeklySummary} onChange={setWeeklySummary} />
                    </PrefRow>
                  </div>
                </Section>

                <Divider />

                <Section title="In-app" subtitle="Push alerts and real-time updates inside the app.">
                  <div className="divide-y divide-slate-800 rounded-xl border border-slate-800">
                    <PrefRow label="Push notifications" detail="Parlay grading, HR board hits, and live game alerts.">
                      <Toggle checked={pushAlerts} onChange={setPushAlerts} />
                    </PrefRow>
                    <PrefRow label="Public profile" detail="Show your creator profile and stats on public leaderboards.">
                      <Toggle checked={profilePublic} onChange={setProfilePublic} />
                    </PrefRow>
                    <PrefRow label="Reduce motion" detail="Lower animation intensity across the interface.">
                      <Toggle
                        checked={reduceMotion}
                        onChange={(v) => {
                          setReduceMotion(v);
                          onUpdateProfile({ reduceMotion: v });
                        }}
                      />
                    </PrefRow>
                  </div>
                </Section>
              </div>
            )}

            {/* ── PRIVACY ── */}
            {activeTab === 'privacy' && (
              <div className="space-y-8">
                <Section title="Your data" subtitle="Download a copy of everything VouchEdge holds about your account.">
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-white">Data export</p>
                      <p className="text-xs text-slate-500">Download your picks, parlays, profile, and activity as JSON.</p>
                    </div>
                    <VEButton
                      type="button"
                      onClick={handleExportData}
                      disabled={privacyLoading === 'export'}
                      variant="ghost"
                      className="border-slate-700 text-slate-200"
                    >
                      {privacyLoading === 'export' ? <Loader className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Export
                    </VEButton>
                  </div>
                </Section>

                <Divider />

                <Section title="Local data" subtitle="Reset preview data stored on this device only.">
                  <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-white">Reset local data</p>
                      <p className="text-xs text-slate-500">Clears picks, slips, vouches, and profile previews on this browser.</p>
                    </div>
                    <VEButton
                      type="button"
                      onClick={handleResetClick}
                      variant="ghost"
                      className="border-slate-700 text-slate-200"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reset
                    </VEButton>
                  </div>
                </Section>

                <Divider />

                <Section title="Danger zone" subtitle="Irreversible actions for your account.">
                  <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-5">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="text-sm font-medium text-red-300">Delete account</p>
                        <p className="mt-0.5 text-xs text-red-400/70">
                          Schedules deletion with a 30-day grace period. Active subscriptions will be cancelled. This cannot be undone.
                        </p>
                      </div>
                      <VEButton
                        type="button"
                        onClick={handleScheduleDeletion}
                        disabled={privacyLoading === 'delete'}
                        variant="ghost"
                        className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                      >
                        {privacyLoading === 'delete' ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Delete account
                      </VEButton>
                    </div>
                  </div>
                </Section>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
