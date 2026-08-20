import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  Globe,
  Loader,
  Lock,
  Mail,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { CreatorProofProfile } from '../types';
import { apiClient } from '../lib/apiClient';
import { normalizeCapperSettings, type CapperHeroStyle } from '../lib/capperSettings';
import { disableBrowserPush, enableBrowserPush } from '../lib/pushNotifications';
import { supabase } from '../lib/supabaseClient';
import { useAuthSession } from '../lib/authSessionStore';
import {
  fetchBillingStatus,
  openBillingPortal,
  startStripeCheckout,
  tierToSubscriptionTier,
  type BillingStatus,
} from '../lib/billingClient';
import { buildPremiumAccessModel, type BillingSourceState } from './premiumAccessModel';
import ConnectDiscordButton, { type ConnectDiscordButtonProfile } from './discord/ConnectDiscordButton';
import {
  FREE_BETA_ALL_ACCESS,
  FREE_BETA_BLURB,
  FREE_BETA_HEADLINE,
  PAYMENTS_ENABLED,
} from '../lib/betaAccess';
import { AuroraMaxCommandHeader, AuroraMaxTruthBadge } from './aurora-max/AuroraMaxPrimitives';
import {
  getStoredConsent,
  saveConsent,
  revokeConsent,
  getGlobalPrivacyControl,
  onConsentChange,
  type ConsentState,
} from '../lib/cookieConsent';
import './settings-next.css';
import { useAmbient3dEnabled, useAmbient3dStore } from '@/stores/ambient3dStore';

/*
 * Next surface language — the same vocabulary today-next / live-games-next /
 * hr-next are built from: obsidian panels, emerald accent, mono micro-labels.
 * Held as constants so a token change lands everywhere at once.
 */
const NEXT_PAGE = 'settings-next';
const NEXT_PAD_X = 'px-4 sm:px-8';
const NEXT_PAD_Y = 'py-5 sm:py-6';
const NEXT_PANEL = 'rounded-2xl border border-white/10 bg-ve-obsidian/90';
const NEXT_SURFACE = 'border border-white/10 bg-black/30';
const NEXT_LABEL = 'font-mono text-[9px] font-black uppercase tracking-[0.18em]';
const NEXT_ACTIVE = 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/15 text-[var(--aurora-max-emerald)]';
const NEXT_IDLE = 'border-white/10 bg-white/5 text-white/45 hover:border-white/25 hover:text-white';

const NEXT_BTN =
  'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 font-mono text-[10px] font-black uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-40';
const NEXT_BTN_PRIMARY = `${NEXT_BTN} border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/15 text-[var(--aurora-max-emerald)] hover:bg-[var(--aurora-max-emerald)]/30`;
const NEXT_BTN_GHOST = `${NEXT_BTN} border-white/10 bg-white/5 text-white/75 hover:border-white/25 hover:text-white`;
const NEXT_BTN_DANGER = `${NEXT_BTN} border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20`;

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

type CapperBusinessProduct = {
  id: string;
  code: 'free-follow' | 'vip-club' | string;
  name: string;
  description: string;
  pricingModel: 'free' | 'one_time' | 'recurring' | 'waitlist';
  priceCents: number;
  billingInterval: string | null;
  visibility: 'public' | 'hidden' | 'waitlist' | string;
  active: boolean;
  accessScope?: Record<string, boolean>;
};

type SettingsTab = 'account' | 'capper' | 'billing' | 'notifications' | 'privacy';
type AppTier = 'BASIC' | 'GOLD' | 'SELLER_PRO';

const PLAN_COPY: Record<AppTier, { title: string; price: string; detail: string; badge?: string }> = {
  BASIC: {
    title: 'Free',
    price: '$0',
    detail: 'Core MLB research, saved slips, and account tools.',
  },
  GOLD: {
    title: 'VouchEdge Beta',
    price: '$7.99',
    detail: '7 days free, then $7.99/month. Includes Pro labs, advanced graphs, and matchup research.',
    badge: '7 days free',
  },
  SELLER_PRO: {
    title: 'Free Open Beta',
    price: '$0',
    detail: 'Every feature is unlocked during the open beta.',
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
  if (t === 'GOLD' || t === 'PRO') return 'GOLD';
  if (t === 'SELLER_PRO' || t === 'SELLER PRO' || t === 'CREATOR') {
    if (FREE_BETA_ALL_ACCESS) return 'BASIC';
    return 'SELLER_PRO';
  }
  return 'BASIC';
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aurora-max-emerald)]/50 ${
        checked ? 'bg-[var(--aurora-max-emerald)]' : 'bg-white/10'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full shadow-sm transition-transform ${
          checked ? 'translate-x-4 bg-[#02100d]' : 'translate-x-0 bg-white'
        }`}
      />
    </button>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className={`${NEXT_PANEL} mb-5 p-4 sm:p-5`} aria-label={title}>
      <div className="mb-4 border-b border-white/[0.07] pb-3">
        <h2 className={`flex items-center gap-2 ${NEXT_LABEL} text-white`}>
          {Icon ? <Icon className="h-3.5 w-3.5 text-[var(--aurora-max-emerald)]" aria-hidden="true" /> : null}
          {title}
        </h2>
        {subtitle && <p className="mt-1.5 text-[11px] leading-5 text-white/45">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

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
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5 sm:py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="mt-0.5 text-[11px] leading-5 text-white/45">{detail}</p>
      </div>
      <div className="shrink-0 self-start sm:self-center">{children}</div>
    </div>
  );
}

export default function SettingsPageZ8({
  onResetDatabase,
  profileName,
  profile,
  onUpdateProfile,
}: SettingsPageProps) {
  const authSession = useAuthSession();
  const initialCapperSettings = useMemo(() => normalizeCapperSettings(profile.capperSettings), [profile.capperSettings]);
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [displayName, setDisplayName] = useState(profile.displayName || profileName || '');
  const [username, setUsername] = useState(profile.username || '');
  const [customTitle, setCustomTitle] = useState(profile.customTitle || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [twitter, setTwitter] = useState(profile.twitter || '');
  const [discord, setDiscord] = useState(profile.discord || '');
  const [telegram, setTelegram] = useState(profile.telegram || '');
  const [clubName, setClubName] = useState(initialCapperSettings.clubName || profile.displayName || '');
  const [clubTagline, setClubTagline] = useState(initialCapperSettings.clubTagline);
  const [welcomeMessage, setWelcomeMessage] = useState(initialCapperSettings.welcomeMessage);
  const [offerHeadline, setOfferHeadline] = useState(initialCapperSettings.offerHeadline);
  const [offerSummary, setOfferSummary] = useState(initialCapperSettings.offerSummary);
  const [ctaLabel, setCtaLabel] = useState(initialCapperSettings.ctaLabel);
  const [ctaSubtext, setCtaSubtext] = useState(initialCapperSettings.ctaSubtext);
  const [badgeText, setBadgeText] = useState(initialCapperSettings.badgeText);
  const [heroStyle, setHeroStyle] = useState<CapperHeroStyle>(initialCapperSettings.heroStyle);
  const [featuredTagsInput, setFeaturedTagsInput] = useState(initialCapperSettings.featuredTags.join(', '));
  const [subscriberChatEnabled, setSubscriberChatEnabled] = useState(initialCapperSettings.subscriberChatEnabled);
  const [announcementsEnabled, setAnnouncementsEnabled] = useState(initialCapperSettings.announcementsEnabled);
  const [showVerifiedRecord, setShowVerifiedRecord] = useState(initialCapperSettings.showVerifiedRecord);
  const [showTailRate, setShowTailRate] = useState(initialCapperSettings.showTailRate);
  const [profanityFilterEnabled, setProfanityFilterEnabled] = useState(initialCapperSettings.profanityFilterEnabled);
  const [linksAllowed, setLinksAllowed] = useState(initialCapperSettings.linksAllowed);
  const [slowModeSeconds, setSlowModeSeconds] = useState(initialCapperSettings.slowModeSeconds);
  const [autoWelcomeEnabled, setAutoWelcomeEnabled] = useState(initialCapperSettings.autoWelcomeEnabled);

  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('vouchedge_email_alerts') !== 'false');
  const [pushAlerts, setPushAlerts] = useState(() => localStorage.getItem('vouchedge_push_alerts') !== 'false');
  const [followAlerts, setFollowAlerts] = useState(true);
  const [tailAlerts, setTailAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(() => localStorage.getItem('vouchedge_weekly_summary') !== 'false');
  const [profilePublic, setProfilePublic] = useState(() => localStorage.getItem('vouchedge_profile_public') !== 'false');
  const [reduceMotion, setReduceMotion] = useState(Boolean(profile.reduceMotion));
  // Global now — see GlobalAmbientBackdrop; this page only drives the toggle.
  const is3DLayerEnabled = useAmbient3dEnabled();
  const toggle3DLayer = useAmbient3dStore((state) => state.toggle);

  const [checkoutLoading, setCheckoutLoading] = useState<AppTier | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [billingSourceState, setBillingSourceState] = useState<BillingSourceState>('checking');

  const [privacyLoading, setPrivacyLoading] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [capperSaved, setCapperSaved] = useState(false);
  const [capperLoading, setCapperLoading] = useState(false);
  const [capperProducts, setCapperProducts] = useState<CapperBusinessProduct[]>([]);
  const [productSavingCode, setProductSavingCode] = useState<string | null>(null);
  const [billingPortalError, setBillingPortalError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const activeTier = normalizeTier(profile.subscriptionTier);
  const billingModel = buildPremiumAccessModel({
    profileTier: profile.subscriptionTier,
    billingStatus,
    billingSourceState,
  });
  const activePlanPrice = activeTier === 'SELLER_PRO'
    ? 'Creator entitlement'
    : `${PLAN_COPY[activeTier].price}${activeTier === 'GOLD' ? '/mo' : ''}`;

  const nav: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'account', label: 'Profile', icon: User },
    { id: 'capper', label: 'Capper', icon: Globe },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
  ];

  /* Each section is its own screen under the sticky header, so a tab switch
     starts at the top rather than mid-form. Same pane AppNav scroll-tracks. */
  const handleSelectTab = useCallback((id: SettingsTab) => {
    setActiveTab(id);
    setBillingPortalError(null);
    document.getElementById('inner-view-slot')?.scrollTo({ top: 0 });
  }, []);

  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const [cookieConsentState, setCookieConsentState] = useState<ConsentState | null>(() => getStoredConsent());
  const [isGpcActive, setIsGpcActive] = useState(false);

  useEffect(() => {
    setIsGpcActive(getGlobalPrivacyControl());
    setCookieConsentState(getStoredConsent());
    return onConsentChange((next) => {
      setCookieConsentState(next);
    });
  }, []);

  const handleToggleCookieCategory = (category: 'functional' | 'analytics', value: boolean) => {
    const updated = saveConsent(
      {
        ...cookieConsentState,
        [category]: value,
      },
      'settings',
    );
    setCookieConsentState(updated);
    showToast('Cookie preferences updated.');
  };

  const handleResetCookiePreferences = () => {
    revokeConsent();
    setCookieConsentState(null);
    showToast('Cookie preferences reset.');
  };

  const [discordState, setDiscordState] = useState<ConnectDiscordButtonProfile | null>(() => ({
    discord_username: profile.discordUsername ?? null,
    discord_connected_at: profile.discordConnectedAt ?? null,
    discord_guild_member: Boolean(profile.discordGuildMember),
    discord_beta_access: Boolean(profile.discordBetaAccess),
  }));

  const refreshDiscordState = useCallback(async () => {
    try {
      const data = await apiClient.get<Record<string, unknown>>('/api/auth/me');
      const next = {
        discord_username: (data.discord_username as string | null | undefined) ?? null,
        discord_connected_at: (data.discord_connected_at as string | null | undefined) ?? null,
        discord_guild_member: Boolean(data.discord_guild_member),
        discord_beta_access: Boolean(data.discord_beta_access),
      };
      setDiscordState(next);
      onUpdateProfile({
        discordUsername: next.discord_username,
        discordConnectedAt: next.discord_connected_at,
        discordGuildMember: next.discord_guild_member,
        discordBetaAccess: next.discord_beta_access,
      });
    } catch (err) {
      console.warn('[Settings] failed to load Discord connection state', err);
    }
  }, [onUpdateProfile]);

  const refreshBilling = useCallback(async (message?: string, announce = true) => {
    setBillingLoading(true);
    setBillingSourceState('checking');
    const status = await fetchBillingStatus();
    setBillingLoading(false);
    if (!status) {
      setBillingStatus(null);
      setBillingSourceState('unavailable');
      if (announce) showToast('Billing status unavailable. Your saved profile tier is still shown.', 'err');
      return;
    }
    setBillingStatus(status);
    setBillingSourceState('confirmed');
    const nextTier = tierToSubscriptionTier(status.tier);
    onUpdateProfile({ subscriptionTier: nextTier });
    if (announce) showToast(message ?? 'Billing status refreshed.');
  }, [onUpdateProfile, showToast]);

  useEffect(() => {
    let cancelled = false;
    void apiClient
      .get<{ preferences?: { follow_alerts_enabled?: boolean; tail_alerts_enabled?: boolean; browser_push_enabled?: boolean } }>(
        '/api/notification-preferences',
      )
      .then((data) => {
        if (cancelled || !data.preferences) return;
        if (typeof data.preferences.follow_alerts_enabled === 'boolean') {
          setFollowAlerts(data.preferences.follow_alerts_enabled);
        }
        if (typeof data.preferences.tail_alerts_enabled === 'boolean') {
          setTailAlerts(data.preferences.tail_alerts_enabled);
        }
        if (typeof data.preferences.browser_push_enabled === 'boolean') {
          setPushAlerts(data.preferences.browser_push_enabled);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCapperLoading(true);
    void apiClient
      .get<{ business?: { displayName?: string; brandSettings?: any; products?: CapperBusinessProduct[] } }>('/api/creator-business/me')
      .then((data) => {
        if (cancelled || !data.business) return;
        const brand = normalizeCapperSettings(data.business.brandSettings);
        setCapperProducts(data.business.products ?? []);
        setClubName(brand.clubName || profile.displayName || '');
        setClubTagline(brand.clubTagline);
        setWelcomeMessage(brand.welcomeMessage);
        setOfferHeadline(brand.offerHeadline);
        setOfferSummary(brand.offerSummary);
        setCtaLabel(brand.ctaLabel);
        setCtaSubtext(brand.ctaSubtext);
        setBadgeText(brand.badgeText);
        setHeroStyle(brand.heroStyle);
        setFeaturedTagsInput(brand.featuredTags.join(', '));
        setSubscriberChatEnabled(brand.subscriberChatEnabled);
        setAnnouncementsEnabled(brand.announcementsEnabled);
        setShowVerifiedRecord(brand.showVerifiedRecord);
        setShowTailRate(brand.showTailRate);
        setProfanityFilterEnabled(brand.profanityFilterEnabled);
        setLinksAllowed(brand.linksAllowed);
        setSlowModeSeconds(brand.slowModeSeconds);
        setAutoWelcomeEnabled(brand.autoWelcomeEnabled);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCapperLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile.displayName]);

  const persistNotificationPref = async (patch: Record<string, boolean>) => {
    try {
      await apiClient.patch('/api/notification-preferences', patch);
    } catch (err) {
      console.warn('[Settings] notification pref save failed', err);
    }
  };

  const handlePushAlertsToggle = async (value: boolean) => {
    setPushAlerts(value);
    try {
      if (value) {
        await enableBrowserPush();
        showToast('Push notifications enabled.');
        return;
      }
      await disableBrowserPush();
      showToast('Push notifications disabled.');
    } catch (error: any) {
      setPushAlerts(!value);
      showToast(error?.message ?? 'Push notification update failed.', 'err');
    }
  };

  useEffect(() => {
    localStorage.setItem('vouchedge_email_alerts', String(emailAlerts));
    localStorage.setItem('vouchedge_push_alerts', String(pushAlerts));
    localStorage.setItem('vouchedge_weekly_summary', String(weeklySummary));
    localStorage.setItem('vouchedge_profile_public', String(profilePublic));
  }, [emailAlerts, pushAlerts, weeklySummary, profilePublic]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutSucceeded = params.get('checkout') === 'success';
    void refreshBilling(checkoutSucceeded ? 'Payment complete — your plan is updating.' : undefined, checkoutSucceeded);
    if (!checkoutSucceeded) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    } catch { /* cosmetic */ }
  }, [refreshBilling]);

  useEffect(() => {
    void refreshDiscordState();

    const params = new URLSearchParams(window.location.search);
    const discordResult = params.get('discord');
    if (!discordResult) return;

    const reason = params.get('reason');
    if (discordResult === 'connected') {
      showToast("Discord connected — you're verified for Open Beta.");
    } else if (discordResult === 'retry') {
      showToast('Discord connected, but Open Beta verification is still pending. Retry below.', 'err');
    } else if (discordResult === 'denied') {
      showToast('Discord connection was cancelled.', 'err');
    } else {
      showToast(
        reason === 'already_linked_to_another_account'
          ? 'That Discord account is already connected to a different VouchEdge account.'
          : 'Discord connection failed. Please try again.',
        'err',
      );
    }

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('discord');
      url.searchParams.delete('reason');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    } catch { /* cosmetic */ }
    // Intentionally omits refreshDiscordState/showToast to run once on mount —
    // both are stable useCallbacks and re-running per render would re-fire
    // the toast on every rerender if the query params haven't been stripped yet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleCapperSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const featuredTags = featuredTagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 6);

    const brandSettings = {
      clubName: clubName.trim(),
      clubTagline: clubTagline.trim(),
      welcomeMessage: welcomeMessage.trim(),
      offerHeadline: offerHeadline.trim(),
      offerSummary: offerSummary.trim(),
      ctaLabel: ctaLabel.trim(),
      ctaSubtext: ctaSubtext.trim(),
      badgeText: badgeText.trim(),
      heroStyle,
      featuredTags,
      subscriberChatEnabled,
      announcementsEnabled,
      showVerifiedRecord,
      showTailRate,
      profanityFilterEnabled,
      linksAllowed,
      slowModeSeconds,
      autoWelcomeEnabled,
    };

    setCapperLoading(true);
    try {
      const data = await apiClient.put<{ business?: { brandSettings?: any; displayName?: string; products?: CapperBusinessProduct[] } }>('/api/creator-business/me', {
        displayName: clubName.trim() || profile.displayName || 'Creator Club',
        brandSettings,
      });
      const normalized = normalizeCapperSettings(data.business?.brandSettings ?? brandSettings);
      setCapperProducts(data.business?.products ?? capperProducts);
      onUpdateProfile({ capperSettings: normalized });
      setCapperSaved(true);
      setTimeout(() => setCapperSaved(false), 2000);
      showToast('Capper settings saved.');
    } catch (err: any) {
      showToast(err?.message ?? 'Capper settings could not be saved.', 'err');
    } finally {
      setCapperLoading(false);
    }
  };

  const handleProductUpdate = async (product: CapperBusinessProduct, patch: Partial<CapperBusinessProduct>) => {
    const nextProduct: CapperBusinessProduct = {
      ...product,
      ...patch,
      accessScope: { ...(product.accessScope ?? {}), ...(patch.accessScope ?? {}) },
    };
    setProductSavingCode(product.code);
    try {
      const data = await apiClient.put<{ business?: { products?: CapperBusinessProduct[] } }>(
        `/api/creator-business/me/products/${encodeURIComponent(product.code)}`,
        {
          code: product.code,
          name: nextProduct.name,
          description: nextProduct.description,
          pricingModel: nextProduct.pricingModel,
          priceCents: nextProduct.pricingModel === 'free' ? 0 : nextProduct.priceCents,
          billingInterval: nextProduct.pricingModel === 'recurring' ? (nextProduct.billingInterval || 'month') : null,
          visibility: nextProduct.visibility,
          active: nextProduct.active,
          accessScope: nextProduct.accessScope ?? {},
        },
      );
      setCapperProducts(data.business?.products ?? capperProducts.map((entry) => entry.code === nextProduct.code ? nextProduct : entry));
      showToast(`${nextProduct.name} updated.`);
    } catch (err: any) {
      showToast(err?.message ?? 'Product update failed.', 'err');
    } finally {
      setProductSavingCode(null);
    }
  };

  const handleUpgrade = async (tier: AppTier) => {
    if (tier === 'BASIC') { await handleManageBilling(); return; }
    setCheckoutLoading(tier);
    const result = await startStripeCheckout();
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

  const accountEmail = authSession.session?.user?.email ?? null;
  /* Header meta is assembled from values already on the page — nothing estimated. */
  const accountMetaLine = [
    username ? `@${username}` : displayName || 'Account',
    FREE_BETA_ALL_ACCESS ? 'Free Open Beta · $0' : `${PLAN_COPY[activeTier].title} · ${activePlanPrice}`,
    accountEmail ?? 'Session unverified',
  ].join(' · ');

  const billingSourceLabel = FREE_BETA_ALL_ACCESS
    ? 'Free beta — no billing source attached'
    : billingSourceState === 'confirmed'
      ? 'Stripe status confirmed'
      : billingSourceState === 'checking'
        ? 'Checking Stripe…'
        : 'Unavailable — saved profile tier shown';

  const consentReceiptLabel = cookieConsentState?.consented_at
    ? `Saved ${formatDate(cookieConsentState.consented_at)}`
    : isGpcActive
      ? 'GPC enforced by browser'
      : 'Unset — essential cookies only';

  /*
   * The root deliberately carries no `overflow-x-hidden`: that would make this
   * element its own scroll container and strand the sticky header, which needs
   * to stick against `#inner-view-slot`. Horizontal bleed is held off by
   * `min-w-0` here and the max-width body container below.
   */
  return (
    <div className={`relative min-h-0 min-w-0 ve-safe-bottom pb-24 md:pb-8 ${NEXT_PAGE}`}>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 font-mono text-[11px] font-bold shadow-2xl backdrop-blur-md sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm ${
            toast.type === 'ok'
              ? 'border-[var(--aurora-max-emerald)]/30 bg-ve-obsidian/95 text-white'
              : 'border-rose-500/40 bg-rose-950/80 text-rose-200'
          }`}
        >
          {toast.type === 'ok'
            ? <Check className="h-4 w-4 shrink-0 text-[var(--aurora-max-emerald)]" />
            : <Zap className="h-4 w-4 shrink-0 text-rose-400" />}
          {toast.msg}
        </div>
      )}

      {/* Sticky command header — identity, plan truth, and the section rail. */}
      <div className={`sticky top-0 z-30 space-y-3 border-b border-white/5 bg-ve-obsidian/95 py-4 backdrop-blur-md ${NEXT_PAD_X}`}>
        <div className="mx-auto max-w-5xl">
          <AuroraMaxCommandHeader
            compact
            eyebrow={
              <span className="flex items-center gap-2">
                <Settings className="h-3 w-3" aria-hidden="true" /> Aurora Max
              </span>
            }
            title="Settings Terminal"
            description={`v1.0 Account · ${accountMetaLine}`}
            meta={
            <div className="flex shrink-0 items-center gap-2">
            <AuroraMaxTruthBadge
              state={FREE_BETA_ALL_ACCESS || billingSourceState === 'confirmed' ? 'confirmed' : billingSourceState === 'checking' ? 'projected' : 'missing'}
            >
              {FREE_BETA_ALL_ACCESS ? 'Free Open Beta' : PLAN_COPY[activeTier].title}
            </AuroraMaxTruthBadge>
            {activeTier === 'BASIC' && !FREE_BETA_ALL_ACCESS && (
              <button
                type="button"
                onClick={() => handleSelectTab('billing')}
                className={`${NEXT_BTN_PRIMARY} ve-touch-target`}
              >
                Upgrade <ChevronRight className="h-3 w-3" />
              </button>
            )}

            <button
              type="button"
              onClick={() => toggle3DLayer()}
              disabled={reduceMotion}
              title={reduceMotion ? 'Disabled by the Reduce motion preference' : 'Toggle the ambient field'}
              className={`px-2.5 py-1 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                is3DLayerEnabled && !reduceMotion
                  ? 'bg-[var(--aurora-max-emerald)]/20 text-[var(--aurora-max-emerald)] hover:bg-[var(--aurora-max-emerald)]/30'
                  : 'bg-white/10 text-white/50 hover:bg-white/20'
              }`}
            >
              3D: {is3DLayerEnabled && !reduceMotion ? 'ON' : 'OFF'}
            </button>
            </div>
            }
          />
        </div>

        <nav className="mx-auto max-w-5xl" aria-label="Settings sections">
          <div className="settings-next-rail -mx-1 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-1 pb-0.5">
            {nav.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-current={activeTab === id ? 'page' : undefined}
                onClick={() => handleSelectTab(id)}
                className={`ve-touch-target flex shrink-0 snap-start items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider transition ${
                  activeTab === id
                    ? NEXT_ACTIVE
                    : NEXT_IDLE
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Body */}
      <div className={`mx-auto max-w-5xl ${NEXT_PAD_Y} ${NEXT_PAD_X}`}>
        <div className="min-w-0">

            {/* ── ACCOUNT ── */}
            {activeTab === 'account' && (
              <>
                <form onSubmit={handleProfileSave} className="space-y-6">
                  {/* Avatar + name */}
                  <Section icon={User} title="Profile" subtitle="This is your public identity on VouchEdge.">
                    <div className={`${NEXT_SURFACE} flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:p-5`}>
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--aurora-max-emerald)]/30 bg-[var(--aurora-max-emerald)]/10 font-mono text-base font-black text-[var(--aurora-max-emerald)]">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{displayName || 'Display name'}</p>
                        <p className="text-xs text-white/50">@{username || 'username'}</p>
                        <p className="mt-1 text-xs text-white/60">{customTitle || 'No title set'}</p>
                      </div>
                    </div>
                  </Section>

                  {/* Discord Open Beta connect */}
                  <Section
                    icon={Sparkles}
                    title="Open Beta access"
                    subtitle="Connect Discord to join the VouchEdge server and unlock the @Open Beta role. This is separate from the plain Discord link under Social links below."
                  >
                    <ConnectDiscordButton
                      profile={
                        discordState ?? {
                          discord_username: profile.discordUsername ?? null,
                          discord_connected_at: profile.discordConnectedAt ?? null,
                          discord_guild_member: Boolean(profile.discordGuildMember),
                          discord_beta_access: Boolean(profile.discordBetaAccess),
                        }
                      }
                      email={authSession.session?.user?.email}
                      onVerified={refreshDiscordState}
                    />
                  </Section>

                  {/* Fields */}
                  <Section icon={User} title="General" subtitle="Update your display name, username, and bio.">
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-white/60">Display name</label>
                          <input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className={`w-full rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`}
                            placeholder="Your name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-white/60">Username</label>
                          <div className={`flex rounded-lg focus-within:border-[var(--aurora-max-emerald)]/50 focus-within:ring-1 focus-within:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`}>
                            <span className="flex items-center pl-3 text-sm text-white/40">@</span>
                            <input
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder-white/40 outline-none"
                              placeholder="username"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-white/60">Profile title</label>
                        <input
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          className={`w-full rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`}
                          placeholder="e.g. MLB Researcher"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-white/60">Bio</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          maxLength={180}
                          rows={3}
                          className={`w-full resize-none rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`}
                          placeholder="Short bio (max 180 chars)"
                        />
                        <p className="text-right text-[10px] text-white/40">{bio.length}/180</p>
                      </div>
                    </div>
                  </Section>

                  {/* Socials */}
                  <Section icon={Globe} title="Social links" subtitle="Connect your public profiles and channels.">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        { key: 'twitter', label: 'X (Twitter)', placeholder: '@handle', value: twitter, set: setTwitter },
                        { key: 'discord', label: 'Discord', placeholder: 'server or username', value: discord, set: setDiscord },
                        { key: 'telegram', label: 'Telegram', placeholder: '@channel', value: telegram, set: setTelegram },
                      ].map(({ key, label, placeholder, value, set }) => (
                        <div key={key} className="space-y-1.5">
                          <label className="text-xs font-medium text-white/60">{label}</label>
                          <input
                            value={value}
                            onChange={(e) => set(e.target.value)}
                            className={`w-full rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`}
                            placeholder={placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  </Section>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="submit"
                      className={`${NEXT_BTN_PRIMARY} ve-touch-target w-full sm:w-auto`}
                    >
                      {profileSaved ? <Check className="h-4 w-4" /> : null}
                      {profileSaved ? 'Saved' : 'Save changes'}
                    </button>
                  </div>
                </form>

                <div className="mt-10">
                  <Section
                    icon={Lock}
                    title="Security"
                    subtitle="Update your password. You must be signed in to change it."
                  >
                    <form onSubmit={handleChangePassword} className="space-y-4" autoComplete="new-password">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-white/60">New password</label>
                          <div className={`flex rounded-lg focus-within:border-[var(--aurora-max-emerald)]/50 focus-within:ring-1 focus-within:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`}>
                            <input
                              type={showNewPw ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                              autoComplete="new-password"
                              placeholder="Min. 8 characters"
                              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-white/40 outline-none"
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setShowNewPw((v) => !v)}
                              className="flex items-center pr-3 text-white/40 hover:text-white/70 transition-colors"
                              aria-label={showNewPw ? 'Hide password' : 'Show password'}
                            >
                              {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-white/60">Confirm password</label>
                          <div className={`flex rounded-lg focus-within:border-[var(--aurora-max-emerald)]/50 focus-within:ring-1 focus-within:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`}>
                            <input
                              type={showConfirmPw ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                              autoComplete="new-password"
                              placeholder="Repeat new password"
                              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-white/40 outline-none"
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setShowConfirmPw((v) => !v)}
                              className="flex items-center pr-3 text-white/40 hover:text-white/70 transition-colors"
                              aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                            >
                              {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {newPassword.length > 0 && newPassword.length < 8 && (
                        <p className="font-mono text-[11px] text-amber-300">
                          {8 - newPassword.length} more character{8 - newPassword.length !== 1 ? 's' : ''} needed
                        </p>
                      )}

                      {passwordError && (
                        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2.5">
                          <Lock className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                          <p className="font-mono text-[11px] text-rose-300">{passwordError}</p>
                        </div>
                      )}

                      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                        <button
                          type="submit"
                          disabled={passwordLoading || newPassword.length < 8 || newPassword !== confirmPassword}
                          className={`${NEXT_BTN_GHOST} ve-touch-target w-full sm:w-auto`}
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

            {/* ── CAPPER ── */}
            {activeTab === 'capper' && (
              <form onSubmit={handleCapperSave} className="space-y-6">
                <Section icon={Globe} title="Club identity" subtitle="This powers how your subscriber club looks and reads across SocialOS and the club hub.">
                  <div className={`${NEXT_SURFACE} rounded-xl p-4 sm:p-5 mb-4`}>
                    <div className={`rounded-2xl border p-4 ${
                      heroStyle === 'emerald'
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : heroStyle === 'crimson'
                          ? 'border-rose-500/30 bg-rose-500/10'
                          : 'border-vouch-emerald/25 bg-vouch-emerald/10'
                    }`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className={`${NEXT_LABEL} text-white/45`}>{badgeText || 'CREATOR CLUB'}</p>
                          <h3 className="mt-1 text-lg font-semibold text-white">{clubName || displayName || 'Your club'}</h3>
                          <p className="mt-1 text-sm text-white/65">{clubTagline || 'Shared parlays, verified wins, and clean subscriber access.'}</p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-white/55">
                          {heroStyle}
                        </div>
                      </div>
                      <p className="mt-4 text-xs leading-relaxed text-white/55">{welcomeMessage}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 mb-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-white/60">Club name</label>
                      <input value={clubName} onChange={(e) => setClubName(e.target.value)} className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`} placeholder="Zhavior Club" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-white/60">Badge text</label>
                      <input value={badgeText} onChange={(e) => setBadgeText(e.target.value)} className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`} placeholder="CREATOR CLUB" />
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <label className="text-xs font-medium text-white/60">Club tagline</label>
                    <input value={clubTagline} onChange={(e) => setClubTagline(e.target.value)} className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`} placeholder="What your club is known for" />
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <label className="text-xs font-medium text-white/60">Welcome message</label>
                    <textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={3} className={`w-full resize-none rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`} placeholder="What a new follower should feel immediately" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Club look</label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(['midnight', 'emerald', 'crimson'] as CapperHeroStyle[]).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setHeroStyle(style)}
                          className={`rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                            heroStyle === style
                              ? 'border-[var(--aurora-max-emerald)]/40 bg-[var(--aurora-max-emerald)]/10 text-white'
                              : 'border-white/10 bg-black/30 text-white/60 hover:border-white/25 hover:text-white'
                          }`}
                        >
                          <div className="font-semibold capitalize">{style}</div>
                          <div className="mt-1 text-xs text-white/40">Club header treatment</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </Section>

                <Section icon={Sparkles} title="Offer and conversion" subtitle="This controls the language around why someone should follow your club.">
                  <div className="grid gap-4 sm:grid-cols-2 mb-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-white/60">Offer headline</label>
                      <input value={offerHeadline} onChange={(e) => setOfferHeadline(e.target.value)} className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`} placeholder="Free follow during beta" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-white/60">Primary CTA</label>
                      <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`} placeholder="Follow club" />
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <label className="text-xs font-medium text-white/60">Offer summary</label>
                    <textarea value={offerSummary} onChange={(e) => setOfferSummary(e.target.value)} rows={3} className={`w-full resize-none rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`} placeholder="Explain exactly what a follow unlocks" />
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <label className="text-xs font-medium text-white/60">CTA subtext</label>
                    <input value={ctaSubtext} onChange={(e) => setCtaSubtext(e.target.value)} className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`} placeholder="Unlock shared parlays and club updates" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Featured tags</label>
                    <input value={featuredTagsInput} onChange={(e) => setFeaturedTagsInput(e.target.value)} className={`w-full rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25 ${NEXT_SURFACE}`} placeholder="MLB, Parlays, Verified" />
                    <p className="text-[11px] text-white/40">Comma-separated. We use up to 6 tags across your club previews.</p>
                  </div>
                </Section>

                <Section icon={CreditCard} title="Products and access" subtitle="These are the actual business products behind your club.">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {capperProducts.map((product) => {
                      const isSaving = productSavingCode === product.code;
                      const accessScope = product.accessScope ?? {};
                      return (
                        <div key={product.id} className={`rounded-xl p-4 space-y-4 ${NEXT_SURFACE}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{product.name}</p>
                              <p className="mt-1 text-xs leading-relaxed text-white/50">{product.description}</p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
                              product.active ? 'bg-vouch-emerald/15 text-vouch-emerald' : 'bg-white/5 text-white/40'
                            }`}>
                              {product.active ? 'Live' : 'Off'}
                            </span>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-white/60">Product name</label>
                              <input
                                value={product.name}
                                onChange={(e) => setCapperProducts((current) => current.map((entry) => entry.code === product.code ? { ...entry, name: e.target.value } : entry))}
                                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-white/60">Pricing model</label>
                              <select
                                value={product.pricingModel}
                                onChange={(e) => setCapperProducts((current) => current.map((entry) => entry.code === product.code ? { ...entry, pricingModel: e.target.value as CapperBusinessProduct['pricingModel'] } : entry))}
                                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25"
                              >
                                <option value="free">Free</option>
                                <option value="waitlist">Waitlist</option>
                                <option value="one_time">One-time</option>
                                <option value="recurring">Recurring</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-white/60">Product description</label>
                            <textarea
                              value={product.description}
                              onChange={(e) => setCapperProducts((current) => current.map((entry) => entry.code === product.code ? { ...entry, description: e.target.value } : entry))}
                              rows={3}
                              className="w-full resize-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25"
                            />
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-white/60">Price</label>
                              <input
                                type="number"
                                min={0}
                                value={Math.round((product.priceCents ?? 0) / 100)}
                                onChange={(e) => setCapperProducts((current) => current.map((entry) => entry.code === product.code ? { ...entry, priceCents: Math.max(0, Number(e.target.value) || 0) * 100 } : entry))}
                                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-white/60">Billing</label>
                              <select
                                value={product.billingInterval ?? 'month'}
                                onChange={(e) => setCapperProducts((current) => current.map((entry) => entry.code === product.code ? { ...entry, billingInterval: e.target.value } : entry))}
                                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25"
                              >
                                <option value="month">Monthly</option>
                                <option value="year">Yearly</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-white/60">Visibility</label>
                              <select
                                value={product.visibility}
                                onChange={(e) => setCapperProducts((current) => current.map((entry) => entry.code === product.code ? { ...entry, visibility: e.target.value as CapperBusinessProduct['visibility'] } : entry))}
                                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25"
                              >
                                <option value="public">Public</option>
                                <option value="hidden">Hidden</option>
                                <option value="waitlist">Waitlist</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <PrefRow label="Shared parlays" detail="Members of this product can unlock shared slips.">
                              <Toggle checked={accessScope.shared_parlays !== false} onChange={(value) => setCapperProducts((current) => current.map((entry) => entry.code === product.code ? { ...entry, accessScope: { ...(entry.accessScope ?? {}), shared_parlays: value } } : entry))} />
                            </PrefRow>
                            <PrefRow label="Club chat" detail="Members can enter and talk in club chat.">
                              <Toggle checked={accessScope.club_chat !== false} onChange={(value) => setCapperProducts((current) => current.map((entry) => entry.code === product.code ? { ...entry, accessScope: { ...(entry.accessScope ?? {}), club_chat: value } } : entry))} />
                            </PrefRow>
                          </div>

                          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                            <div className="flex items-center gap-2">
                              <Toggle
                                checked={product.active}
                                onChange={(value) => setCapperProducts((current) => current.map((entry) => entry.code === product.code ? { ...entry, active: value } : entry))}
                              />
                              <span className="text-xs text-white/60">Product active</span>
                            </div>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => void handleProductUpdate(product, {})}
                              className={NEXT_BTN_GHOST}
                            >
                              {isSaving ? 'Saving…' : 'Save product'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>

                <Section icon={Shield} title="Trust and content" subtitle="Decide what proof and club surfaces stay visible to followers.">
                  <div className={`divide-y divide-white/5 rounded-xl ${NEXT_SURFACE}`}>
                    <PrefRow label="Show verified record" detail="Keep your tracked record visible on the club surface.">
                      <Toggle checked={showVerifiedRecord} onChange={setShowVerifiedRecord} />
                    </PrefRow>
                    <PrefRow label="Show tail-rate framing" detail="Reserve space for follower performance and tailing trust signals.">
                      <Toggle checked={showTailRate} onChange={setShowTailRate} />
                    </PrefRow>
                    <PrefRow label="Subscriber chat live" detail="Let followers talk in the club chat room.">
                      <Toggle checked={subscriberChatEnabled} onChange={setSubscriberChatEnabled} />
                    </PrefRow>
                    <PrefRow label="Announcements live" detail="Allow official club broadcasts in the announcements feed.">
                      <Toggle checked={announcementsEnabled} onChange={setAnnouncementsEnabled} />
                    </PrefRow>
                    <PrefRow label="Auto welcome tone" detail="Keep your saved welcome copy prominent across the club entry points.">
                      <Toggle checked={autoWelcomeEnabled} onChange={setAutoWelcomeEnabled} />
                    </PrefRow>
                  </div>
                </Section>

                <Section icon={Shield} title="Moderation defaults" subtitle="These are the guardrails for how your club should behave as it grows.">
                  <div className={`divide-y divide-white/5 rounded-xl ${NEXT_SURFACE}`}>
                    <PrefRow label="Profanity filter" detail="Keep basic bad-word blocking turned on for subscriber chat.">
                      <Toggle checked={profanityFilterEnabled} onChange={setProfanityFilterEnabled} />
                    </PrefRow>
                    <PrefRow label="Allow links" detail="Permit links in club messages. Keep this off if you want a cleaner room.">
                      <Toggle checked={linksAllowed} onChange={setLinksAllowed} />
                    </PrefRow>
                    <div className="px-4 py-4 sm:px-5 sm:py-3.5">
                      <label className="text-sm font-medium text-white">Slow mode seconds</label>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/50">0 keeps chat fully open. Higher values reduce spam.</p>
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={slowModeSeconds}
                        onChange={(e) => setSlowModeSeconds(Math.min(300, Math.max(0, Number(e.target.value) || 0)))}
                        className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[var(--aurora-max-emerald)]/50 focus:ring-1 focus:ring-[var(--aurora-max-emerald)]/25 sm:max-w-[160px]"
                      />
                    </div>
                  </div>
                </Section>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="submit"
                    className={`${NEXT_BTN_PRIMARY} ve-touch-target w-full sm:w-auto`}
                  >
                    {capperSaved ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    {capperSaved ? 'Saved' : 'Save capper settings'}
                  </button>
                </div>
              </form>
            )}

            {/* ── BILLING ── */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <Section
                  icon={Zap}
                  title="Subscription"
                  subtitle={FREE_BETA_ALL_ACCESS ? 'Your access during the free open beta.' : 'Manage your plan and payment method.'}
                >
                  <div className={`${NEXT_SURFACE} flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 mb-4`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vouch-emerald/15 text-vouch-emerald">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{billingModel.accessLabel}</p>
                        {!FREE_BETA_ALL_ACCESS && (
                          <p className="text-xs text-white/50">Profile tier {billingModel.activeTier}</p>
                        )}
                        <p className="mt-1 text-xs text-white/40">{billingModel.billingDetail}</p>
                        {!FREE_BETA_ALL_ACCESS && billingStatus?.currentPeriodEnd && (
                          <p className="mt-1 text-xs text-white/40">Current billing period ends {formatDate(billingStatus.currentPeriodEnd)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <AuroraMaxTruthBadge state={billingSourceState === 'confirmed' || FREE_BETA_ALL_ACCESS ? 'confirmed' : billingSourceState === 'checking' ? 'projected' : 'missing'}>
                        {billingModel.billingLabel}
                      </AuroraMaxTruthBadge>
                      {!FREE_BETA_ALL_ACCESS && (
                        <button
                          type="button"
                          onClick={() => refreshBilling()}
                          disabled={billingLoading}
                          className={NEXT_BTN_GHOST}
                        >
                          {billingLoading ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                          Refresh
                        </button>
                      )}
                    </div>
                  </div>

                  {FREE_BETA_ALL_ACCESS ? (
                    <div className={`${NEXT_SURFACE} rounded-xl p-4`}>
                      <p className="text-sm font-semibold text-white">{FREE_BETA_HEADLINE}</p>
                      <p className="mt-1 text-2xl font-bold text-white">$0</p>
                      <p className="mt-2 text-xs leading-5 text-white/50">{FREE_BETA_BLURB}</p>
                      <p className="mt-3 text-xs leading-5 text-white/40">
                        There is no plan to choose, no card on file, and nothing to cancel. We will announce pricing here well before the beta ends.
                      </p>
                    </div>
                  ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(['BASIC', 'GOLD'] as AppTier[]).map((tier) => {
                      const plan = PLAN_COPY[tier];
                      const isActive = tier === 'BASIC' ? activeTier === 'BASIC' : activeTier !== 'BASIC';
                      const isLoading = checkoutLoading === tier;
                      return (
                        <article
                          key={tier}
                          className={`relative rounded-xl border p-4 transition-colors ${
                            isActive
                              ? 'border-[var(--aurora-max-emerald)]/30 bg-[var(--aurora-max-emerald)]/[0.06]'
                              : 'border-white/10 bg-black/30 hover:border-white/25'
                          }`}
                        >
                          {plan.badge && !isActive && (
                            <span className="absolute right-3 top-3 rounded-full bg-vouch-amber/15 px-2 py-0.5 text-[10px] font-semibold text-vouch-amber">
                              {plan.badge}
                            </span>
                          )}
                          {isActive && (
                            <AuroraMaxTruthBadge state="confirmed" className="absolute right-3 top-3">Current</AuroraMaxTruthBadge>
                          )}

                          <p className="text-sm font-semibold text-white">{plan.title}</p>
                          <p className="mt-1 text-2xl font-bold text-white">
                            {plan.price}
                            {tier !== 'BASIC' && <span className="text-sm font-normal text-white/50">/mo</span>}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-white/50">{plan.detail}</p>

                          <button
                            type="button"
                            disabled={isActive || isLoading}
                            onClick={() => handleUpgrade(tier)}
                            className={`${!isActive && tier !== 'BASIC' ? NEXT_BTN_PRIMARY : NEXT_BTN_GHOST} mt-4 w-full`}
                          >
                            {isLoading && <Loader className="h-3 w-3 animate-spin" />}
                            {isActive
                              ? 'Your plan'
                              : tier === 'BASIC'
                                ? 'Downgrade'
                                : 'Start 7-day free trial'}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                  )}
                </Section>

                {PAYMENTS_ENABLED && (
                <Section icon={CreditCard} title="Payment method" subtitle="Stripe manages payment methods, invoices, and cancellation for paid accounts.">
                  <div className="space-y-3">
                    {billingModel.shouldManageBilling ? (
                      <button
                        type="button"
                        onClick={handleManageBilling}
                        disabled={portalLoading}
                        className={`${NEXT_BTN_GHOST} ve-touch-target w-full sm:w-auto`}
                      >
                        {portalLoading ? <Loader className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                        Manage billing
                        <ExternalLink className="h-3.5 w-3.5 text-white/40" />
                      </button>
                    ) : (
                      <p className="text-xs leading-relaxed text-white/45">
                        The billing portal becomes available after a paid subscription is attached to this account.
                      </p>
                    )}
                    {billingPortalError && (
                      <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-950/30 px-4 py-3">
                        <Zap className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white">Billing portal unavailable</p>
                          <p className="mt-0.5 font-mono text-[11px] leading-4 text-rose-300/80">{billingPortalError}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBillingPortalError(null)}
                          className="ml-auto shrink-0 text-rose-500/60 transition-colors hover:text-rose-400"
                          aria-label="Dismiss"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </Section>
                )}
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <Section icon={Mail} title="Email" subtitle="Control which emails VouchEdge sends to you.">
                  <div className={`divide-y divide-white/5 rounded-xl ${NEXT_SURFACE}`}>
                    <PrefRow label="Account alerts" detail="Security and billing notifications.">
                      <Toggle checked={emailAlerts} onChange={setEmailAlerts} />
                    </PrefRow>
                    <PrefRow label="Weekly recap" detail="A summary of your picks, results, and activity each week.">
                      <Toggle checked={weeklySummary} onChange={setWeeklySummary} />
                    </PrefRow>
                  </div>
                </Section>

                <Section icon={Bell} title="In-app" subtitle="Push alerts and real-time updates inside the app.">
                  <div className={`divide-y divide-white/5 rounded-xl ${NEXT_SURFACE}`}>
                    <PrefRow label="Push notifications" detail="Parlay grading, HR board hits, and live game alerts.">
                      <Toggle checked={pushAlerts} onChange={(value) => { void handlePushAlertsToggle(value); }} />
                    </PrefRow>
                    <PrefRow label="Following alerts" detail="Posts and activity from people you follow. Turned on automatically when you follow someone.">
                      <Toggle
                        checked={followAlerts}
                        onChange={(value) => {
                          setFollowAlerts(value);
                          void persistNotificationPref({ follow_alerts_enabled: value });
                        }}
                      />
                    </PrefRow>
                    <PrefRow label="Tailing alerts" detail="When creators you tail lock slips or share parlays.">
                      <Toggle
                        checked={tailAlerts}
                        onChange={(value) => {
                          setTailAlerts(value);
                          void persistNotificationPref({ tail_alerts_enabled: value });
                        }}
                      />
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
              <div className="space-y-6">
                <Section
                  icon={Shield}
                  title="Cookie & telemetry choices"
                  subtitle="Manage essential security cookies and optional performance telemetry."
                >
                  <div className="space-y-4">
                    <div className={`flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 ${NEXT_SURFACE}`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">Consent status</p>
                          <AuroraMaxTruthBadge
                            state={cookieConsentState ? 'confirmed' : isGpcActive ? 'projected' : 'missing'}
                          >
                            {cookieConsentState
                              ? 'Active'
                              : isGpcActive
                                ? 'GPC Enforced'
                                : 'Default / Unset'}
                          </AuroraMaxTruthBadge>
                        </div>
                        <p className="text-xs text-white/50">
                          {cookieConsentState?.consented_at
                            ? `Last updated on ${formatDate(cookieConsentState.consented_at)}`
                            : 'First-party essential cookies active.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetCookiePreferences}
                        className={`${NEXT_BTN_GHOST} ve-touch-target w-full shrink-0 sm:w-auto`}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Reset choices
                      </button>
                    </div>

                    <div className={`divide-y divide-white/5 rounded-xl ${NEXT_SURFACE}`}>
                      <PrefRow
                        label="Strictly necessary"
                        detail="Session authentication, CSRF validation, and platform stability. Required for VouchEdge to function."
                      >
                        <span className="font-mono text-xs text-[#a8d8b6]/80 bg-[#0d2318] px-2 py-0.5 rounded border border-[#a8d8b6]/30">
                          Locked On
                        </span>
                      </PrefRow>

                      <PrefRow
                        label="Functional preferences"
                        detail="Preserves custom layout filters, collapsed states, and draft research slips across browser visits."
                      >
                        <Toggle
                          checked={cookieConsentState?.functional ?? true}
                          onChange={(v) => handleToggleCookieCategory('functional', v)}
                        />
                      </PrefRow>

                      <PrefRow
                        label="Analytics & performance telemetry"
                        detail="Anonymized PostHog usage signals and Sentry error diagnostics to improve speed and resolve bugs."
                      >
                        <Toggle
                          checked={Boolean(cookieConsentState?.analytics)}
                          onChange={(v) => handleToggleCookieCategory('analytics', v)}
                        />
                      </PrefRow>

                      <PrefRow
                        label="Marketing & advertising"
                        detail="VouchEdge does not use advertising cookies, marketing pixels, or third-party ad networks."
                      >
                        <span className="font-mono text-xs text-white/40">Not Used</span>
                      </PrefRow>
                    </div>
                  </div>
                </Section>

                <Section icon={Download} title="Your data" subtitle="Download a copy of everything VouchEdge holds about your account.">
                  <div className={`flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 ${NEXT_SURFACE}`}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">Data export</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/50">Download your picks, parlays, profile, and activity as JSON.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportData}
                      disabled={privacyLoading === 'export'}
                      className={`${NEXT_BTN_GHOST} ve-touch-target w-full shrink-0 sm:w-auto`}
                    >
                      {privacyLoading === 'export' ? <Loader className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Export
                    </button>
                  </div>
                </Section>

                <Section icon={RefreshCw} title="Local data" subtitle="Reset preview data stored on this device only.">
                  <div className={`flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 ${NEXT_SURFACE}`}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">Reset local data</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/50">Clears picks, slips, vouches, and profile previews on this browser.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetClick}
                      className={`${NEXT_BTN_GHOST} ve-touch-target w-full shrink-0 sm:w-auto`}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reset
                    </button>
                  </div>
                </Section>

                <Section icon={Trash2} title="Danger zone" subtitle="Irreversible actions for your account.">
                  <div className="rounded-xl border border-rose-500/25 bg-rose-950/25 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">Delete account</p>
                        <p className="mt-0.5 text-[11px] leading-5 text-rose-200/60">
                          Schedules deletion with a 30-day grace period. Active subscriptions will be cancelled. This cannot be undone.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleScheduleDeletion}
                        disabled={privacyLoading === 'delete'}
                        className={`${NEXT_BTN_DANGER} ve-touch-target w-full shrink-0 sm:w-auto`}
                      >
                        {privacyLoading === 'delete' ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Delete account
                      </button>
                    </div>
                  </div>
                </Section>
              </div>
            )}
          </div>

          {/* Receipt — where the values on this page actually came from. */}
          <section className="mt-5 rounded-2xl border border-white/[0.07] bg-black/30 p-4" aria-label="Account source receipt">
            <span className={`flex items-center gap-2 ${NEXT_LABEL} text-white/35`}>
              <FileCheck2 className="h-3 w-3 text-[var(--aurora-max-emerald)]" aria-hidden="true" />
              Source receipt
            </span>
            <div className="mt-2.5 grid gap-3 font-mono sm:grid-cols-3">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.14em] text-white/30">Session</p>
                <p className="mt-1 truncate text-[10px] leading-4 text-white/50">{accountEmail ?? 'Not signed in'}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.14em] text-white/30">Billing source</p>
                <p className="mt-1 text-[10px] leading-4 text-white/50">{billingSourceLabel}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.14em] text-white/30">Cookie consent</p>
                <p className="mt-1 text-[10px] leading-4 text-white/50">{consentReceiptLabel}</p>
              </div>
            </div>
          </section>
      </div>
    </div>
  );
}
