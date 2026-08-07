import React from 'react';
import { AURORA_LABEL, AURORA_PANEL_PREMIUM, AURORA_SECTION_HEADER } from '../../../theme/auroraTokens';
import { LineChart, Users, ArrowUpRight, Activity, CalendarDays, MousePointerClick } from 'lucide-react';

export function AnalyticsModule() {
  return (
    <div className="space-y-6">
      
      {/* Date Range & Controls */}
      <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center`}>
        <div className="flex items-center gap-2">
          <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Last 30 Days
          </button>
          <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Daily Active Users</span>
            <Users className="h-4 w-4 text-vouch-emerald" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">45.2K</h3>
            <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-vouch-emerald" /> 18% vs last month
            </p>
          </div>
        </div>
        
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Monthly Active Users</span>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">182.4K</h3>
            <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-vouch-emerald" /> 12% vs last month
            </p>
          </div>
        </div>

        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Avg Session Time</span>
            <Activity className="h-4 w-4 text-vouch-cyan" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">14m 20s</h3>
            <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-vouch-emerald" /> 5% vs last month
            </p>
          </div>
        </div>

        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Conversion Rate</span>
            <MousePointerClick className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">4.8%</h3>
            <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-vouch-emerald" /> 1.2% vs last month
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Retention Cohorts Mock */}
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5`}>
          <div className={`${AURORA_SECTION_HEADER} mb-5 border-b border-white/5 pb-4`}>
            <h2 className={`${AURORA_LABEL} text-white`}>Retention Cohorts (W1-W4)</h2>
          </div>
          
          <div className="flex flex-col items-center justify-center py-10 opacity-50">
            <LineChart className="h-12 w-12 text-white mb-4" />
            <p className="text-white/70 text-sm">Retention Heatmap Visualization</p>
            <p className="text-white/40 text-xs mt-1">(Chart placeholder)</p>
          </div>
        </div>

        {/* Feature Usage Mock */}
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5`}>
          <div className={`${AURORA_SECTION_HEADER} mb-5 border-b border-white/5 pb-4`}>
            <h2 className={`${AURORA_LABEL} text-white`}>Top Feature Usage</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { name: 'AI Research (HR Board)', usage: '45%' },
              { name: 'Live Parlays', usage: '28%' },
              { name: 'Pro Labs', usage: '15%' },
              { name: 'Settings/Billing', usage: '12%' },
            ].map((feature, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">{feature.name}</span>
                  <span className="text-white font-mono">{feature.usage}</span>
                </div>
                <div className="h-2 w-full bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: feature.usage }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
