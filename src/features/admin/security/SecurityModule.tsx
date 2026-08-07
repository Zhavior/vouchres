import React from 'react';
import { AURORA_LABEL, AURORA_PANEL_PREMIUM, AURORA_SECTION_HEADER } from '../../../theme/auroraTokens';
import { ShieldAlert, ShieldCheck, Lock, Key, Activity, Fingerprint } from 'lucide-react';

export function SecurityModule() {
  return (
    <div className="space-y-6">
      
      {/* Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Security Posture</span>
            <ShieldCheck className="h-4 w-4 text-vouch-emerald" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-vouch-emerald">Optimal</h3>
            <p className="text-xs text-white/40 mt-1">All defenses active</p>
          </div>
        </div>

        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Failed Logins (24h)</span>
            <Lock className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">142</h3>
            <p className="text-xs text-white/40 mt-1">Below anomaly threshold</p>
          </div>
        </div>

        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Active Threats</span>
            <ShieldAlert className="h-4 w-4 text-white/20" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">0</h3>
            <p className="text-xs text-white/40 mt-1">No active incidents</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Access Controls */}
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5`}>
          <div className={`${AURORA_SECTION_HEADER} mb-5 border-b border-white/5 pb-4`}>
            <h2 className={`${AURORA_LABEL} text-white`}>Access & Authentication</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-vouch-cyan/10 flex items-center justify-center">
                <Key className="h-5 w-5 text-vouch-cyan" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">MFA Enforcement (Admins)</h4>
                <p className="text-xs text-white/50 mt-1">Requires Multi-Factor Authentication for all administrative access.</p>
                <div className="mt-2 text-[10px] uppercase font-bold text-vouch-cyan bg-vouch-cyan/10 w-fit px-2 py-0.5 rounded">Enforced</div>
              </div>
            </div>

            <div className="flex items-start gap-4 pt-4 border-t border-white/5">
              <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Fingerprint className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Session Timeout</h4>
                <p className="text-xs text-white/50 mt-1">Maximum idle time before requiring re-authentication.</p>
                <div className="mt-2 text-[10px] uppercase font-bold text-indigo-300 bg-indigo-500/10 w-fit px-2 py-0.5 rounded">60 Minutes</div>
              </div>
            </div>
            
            <div className="flex items-start gap-4 pt-4 border-t border-white/5">
              <div className="h-10 w-10 shrink-0 rounded-full bg-white/5 flex items-center justify-center">
                <Activity className="h-5 w-5 text-white/40" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Suspicious IP Blocking</h4>
                <p className="text-xs text-white/50 mt-1">Automatically blocks IPs exhibiting brute-force behavior.</p>
                <button className="mt-2 text-[10px] uppercase font-bold text-white/50 bg-white/5 hover:bg-white/10 transition-colors w-fit px-2 py-1 rounded">Configure Rules</button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Logs */}
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} overflow-hidden flex flex-col`}>
          <div className={`${AURORA_SECTION_HEADER} p-4 sm:p-5 border-b border-white/5`}>
            <h2 className={`${AURORA_LABEL} text-white`}>Recent Security Events</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             <table className="w-full text-left text-sm text-white/70">
              <tbody className="divide-y divide-white/5">
                {[
                  { event: 'Failed Admin Login', user: 'unknown', ip: '192.168.1.104', time: '10m ago', level: 'warn' },
                  { event: 'MFA Setup Completed', user: 'charlie@example.com', ip: '10.0.0.5', time: '1h ago', level: 'info' },
                  { event: 'API Key Rotated', user: 'system', ip: 'internal', time: '2h ago', level: 'info' },
                  { event: 'Rate Limit Exceeded', user: 'api_client_88', ip: '203.0.113.42', time: '5h ago', level: 'warn' },
                ].map((log, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${log.level === 'warn' ? 'bg-amber-400' : 'bg-vouch-cyan'}`} />
                        <span className="font-medium text-white">{log.event}</span>
                      </div>
                      <div className="text-xs text-white/40 mt-1 font-mono">{log.user} • {log.ip}</div>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-white/40">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
