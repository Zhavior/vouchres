import React, { useState } from 'react';
import {
  LayoutDashboard, Users, CreditCard, Cpu, LineChart, Search, FileText,
  Shield, Lock, Server, ScrollText, HeadphonesIcon, Megaphone, ToggleLeft,
  Database, UserCog
} from 'lucide-react';
import { useAppProfile } from '../../context/AppShellContext';
import { AURORA_PAGE, AURORA_PAGE_PAD_X, AURORA_PAGE_PAD_Y, AURORA_LABEL, AURORA_ACTIVE, AURORA_IDLE, AURORA_PANEL_PREMIUM, AURORA_SECTION_HEADER } from '../../theme/auroraTokens';

export type AuroraHqTab =
  | 'home' | 'users' | 'billing' | 'ai' | 'analytics'
  | 'research' | 'content' | 'privacy' | 'security' | 'system'
  | 'logs' | 'support' | 'marketing' | 'features' | 'data' | 'admins';

const TABS: { id: AuroraHqTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Executive Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'billing', label: 'Billing & Rev', icon: CreditCard },
  { id: 'ai', label: 'AI Operations', icon: Cpu },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
  { id: 'research', label: 'Research Intelligence', icon: Search },
  { id: 'content', label: 'Content Moderation', icon: FileText },
  { id: 'privacy', label: 'Privacy & Trust', icon: Shield },
  { id: 'security', label: 'Security Center', icon: Lock },
  { id: 'system', label: 'System Health', icon: Server },
  { id: 'logs', label: 'Audit Logs', icon: ScrollText },
  { id: 'support', label: 'Support Queue', icon: HeadphonesIcon },
  { id: 'marketing', label: 'Marketing Ops', icon: Megaphone },
  { id: 'features', label: 'Feature Flags', icon: ToggleLeft },
  { id: 'data', label: 'Data Management', icon: Database },
  { id: 'admins', label: 'Admin Roles', icon: UserCog },
];

import { HomeModule } from './home/HomeModule';
import { UsersModule } from './users/UsersModule';
import { BillingModule } from './billing/BillingModule';
import { AiModule } from './ai/AiModule';
import { AnalyticsModule } from './analytics/AnalyticsModule';
import { PrivacyModule } from './privacy/PrivacyModule';
import { SecurityModule } from './security/SecurityModule';
import { AdminModule } from './admins/AdminModule';

export default function AuroraHqShell() {
  const profile = useAppProfile();
  const [activeTab, setActiveTab] = useState<AuroraHqTab>('home');

  if (!profile?.isAdmin) {
    return (
      <div className={`p-8 text-center text-white ${AURORA_PAGE}`}>
        <p>Access Denied: Admins Only</p>
      </div>
    );
  }

  return (
    <div className={`relative min-h-0 min-w-0 overflow-x-hidden ve-safe-bottom pb-24 md:pb-8 ${AURORA_PAGE}`}>
      {/* Page header */}
      <div className={`glass-command border-b border-white/5 bg-black/40 py-4 sm:py-5 ${AURORA_PAGE_PAD_X}`}>
        <div className="mx-auto max-w-7xl">
          <div className={`flex items-center gap-2 text-white/40 ${AURORA_LABEL}`}>
            <Cpu className="h-3.5 w-3.5" />
            Aurora HQ
          </div>
          <h1 className="mt-1 text-lg font-semibold text-white sm:text-xl">VouchEdge Command Center</h1>
        </div>
      </div>

      {/* Body */}
      <div className={`mx-auto max-w-7xl flex flex-col gap-6 lg:flex-row lg:gap-10 ${AURORA_PAGE_PAD_Y} ${AURORA_PAGE_PAD_X}`}>
        
        {/* Mobile tab bar */}
        <nav className="mb-5 lg:hidden" aria-label="Admin modules">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`ve-touch-target snap-start shrink-0 flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  activeTab === id
                    ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 shadow-[0_0_16px_rgba(99,102,241,0.12)]'
                    : 'border-white/10 bg-black/25 text-white/55 hover:border-white/20 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Desktop sidebar nav */}
        <nav className="hidden w-56 shrink-0 lg:block">
          <ul className="space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeTab === id
                      ? 'bg-indigo-500/10 text-indigo-300 font-medium'
                      : `${AURORA_IDLE} hover:bg-white/5`
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* ─── Main content ─── */}
        <div className="min-w-0 flex-1">
          {activeTab === 'home' ? (
            <HomeModule />
          ) : activeTab === 'users' ? (
            <UsersModule />
          ) : activeTab === 'billing' ? (
            <BillingModule />
          ) : activeTab === 'ai' ? (
            <AiModule />
          ) : activeTab === 'analytics' ? (
            <AnalyticsModule />
          ) : activeTab === 'privacy' ? (
            <PrivacyModule />
          ) : activeTab === 'security' ? (
            <SecurityModule />
          ) : activeTab === 'admins' ? (
            <AdminModule />
          ) : (
            <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 mb-6 min-h-[500px]`}>
              <div className={`${AURORA_SECTION_HEADER} mb-5 border-b border-white/5 pb-4`}>
                <h2 className={`${AURORA_LABEL} text-white`}>{TABS.find(t => t.id === activeTab)?.label}</h2>
                <p className="mt-1 text-xs text-white/50">Module stub</p>
              </div>
              
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Cpu className="h-10 w-10 text-white/10 mb-4" />
                <p className="text-white/40 text-sm">
                  This module ({activeTab}) is under construction.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
