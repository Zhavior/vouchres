import React from 'react';
import { AURORA_LABEL, AURORA_PANEL_PREMIUM, AURORA_SECTION_HEADER } from '../../../theme/auroraTokens';
import { Activity, AlertTriangle, ArrowUpRight, DollarSign, Users, Cpu, ShieldAlert } from 'lucide-react';

export function HomeModule() {
  return (
    <div className="space-y-6">
      
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Live Users</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-vouch-emerald bg-vouch-emerald/10 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-vouch-emerald animate-pulse" /> Live
            </span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">1,248</h3>
            <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-vouch-emerald" /> 12% vs last hour
            </p>
          </div>
        </div>

        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Today's Revenue</span>
            <DollarSign className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">$4,850</h3>
            <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-vouch-emerald" /> 8% vs yesterday
            </p>
          </div>
        </div>

        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>AI Spend (24h)</span>
            <Cpu className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">$214.50</h3>
            <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-rose-400" /> 15% vs yesterday
            </p>
          </div>
        </div>

        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>System Health</span>
            <Activity className="h-4 w-4 text-vouch-emerald" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-vouch-emerald">99.99%</h3>
            <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
              All systems operational
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Alerts */}
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 lg:col-span-2`}>
          <div className={`${AURORA_SECTION_HEADER} mb-5 border-b border-white/5 pb-4`}>
            <h2 className={`${AURORA_LABEL} text-white flex items-center gap-2`}>
              <AlertTriangle className="h-4 w-4 text-amber-400" /> Action Required
            </h2>
          </div>
          
          <div className="space-y-3">
            {[
              { title: 'High AI Latency detected on Claude 3.5 Sonnet', severity: 'warn', time: '10m ago' },
              { title: 'Failed payment webhooks (Stripe) spiking', severity: 'critical', time: '1h ago' },
              { title: 'User reported explicit content bypass', severity: 'critical', time: '2h ago' },
            ].map((alert, i) => (
              <div key={i} className={`flex items-start justify-between gap-4 p-3 rounded-lg border ${
                alert.severity === 'critical' ? 'bg-rose-950/20 border-rose-500/20' : 'bg-amber-950/20 border-amber-500/20'
              }`}>
                <div className="flex items-start gap-3">
                  <ShieldAlert className={`h-4 w-4 shrink-0 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <p className="text-xs text-white/40 mt-1">{alert.time}</p>
                  </div>
                </div>
                <button className="shrink-0 text-[10px] font-bold tracking-wider uppercase text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-1 rounded">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Company Health Score */}
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5`}>
          <div className={`${AURORA_SECTION_HEADER} mb-5 border-b border-white/5 pb-4`}>
            <h2 className={`${AURORA_LABEL} text-white`}>Company Health</h2>
          </div>
          
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-vouch-emerald/20">
              <svg className="absolute inset-0 h-full w-full -rotate-90 text-vouch-emerald" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="289" strokeDashoffset="28" />
              </svg>
              <div className="text-center">
                <span className="block text-3xl font-black text-white">92</span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-vouch-emerald">Good</span>
              </div>
            </div>
            
            <div className="mt-8 w-full space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/60">Growth</span>
                <span className="text-xs font-bold text-vouch-emerald">A</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/60">Retention</span>
                <span className="text-xs font-bold text-white">B+</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/60">Margins</span>
                <span className="text-xs font-bold text-white">B</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
