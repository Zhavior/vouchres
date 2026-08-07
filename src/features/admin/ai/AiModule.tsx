import React from 'react';
import { AURORA_LABEL, AURORA_PANEL_PREMIUM, AURORA_SECTION_HEADER } from '../../../theme/auroraTokens';
import { Cpu, Zap, Clock, ShieldAlert, BarChart2 } from 'lucide-react';

const MODELS = [
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', requests: '1.2M', latency: '450ms', cost: '$125.40' },
  { id: 'gemini-1-5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', requests: '450K', latency: '620ms', cost: '$42.10' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', requests: '890K', latency: '510ms', cost: '$89.50' },
];

export function AiModule() {
  return (
    <div className="space-y-6">
      
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Total Requests (24h)</span>
            <Zap className="h-4 w-4 text-vouch-cyan" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">2.5M</h3>
          </div>
        </div>
        
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Avg Latency</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">495ms</h3>
          </div>
        </div>

        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Total Spend (24h)</span>
            <Cpu className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">$257.00</h3>
          </div>
        </div>

        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Error Rate</span>
            <ShieldAlert className="h-4 w-4 text-vouch-emerald" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-vouch-emerald">0.02%</h3>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
          API Keys & Providers
        </button>
        <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
          Prompt History
        </button>
        <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
          Rate Limits
        </button>
      </div>

      {/* Models Table */}
      <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} overflow-hidden`}>
        <div className={`${AURORA_SECTION_HEADER} p-4 sm:p-5 border-b border-white/5`}>
          <h2 className={`${AURORA_LABEL} text-white`}>Model Usage & Performance</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-3 font-medium">Model</th>
                <th className="px-5 py-3 font-medium">Provider</th>
                <th className="px-5 py-3 font-medium">Requests (24h)</th>
                <th className="px-5 py-3 font-medium">Avg Latency</th>
                <th className="px-5 py-3 font-medium">Cost (24h)</th>
                <th className="px-5 py-3 font-medium text-right">Metrics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MODELS.map(model => (
                <tr key={model.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-white font-medium">{model.name}</td>
                  <td className="px-5 py-3 text-white/60">{model.provider}</td>
                  <td className="px-5 py-3 font-mono text-xs">{model.requests}</td>
                  <td className="px-5 py-3 font-mono text-xs text-amber-400/90">{model.latency}</td>
                  <td className="px-5 py-3 font-mono text-xs">{model.cost}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-white/40 hover:text-white transition-colors p-1" title="View Metrics">
                      <BarChart2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
