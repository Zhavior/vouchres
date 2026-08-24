'use client';

import React from 'react';
import { Terminal, Shield, Cpu, Activity, Lock } from 'lucide-react';

export const TerminalFooter: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.08] bg-[#050608] py-12 font-mono text-xs text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Col 1 */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span>VOUCH_EDGE // INSTITUTIONAL SPORTS INTELLIGENCE</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400 max-w-md font-sans">
              Algorithmic home run telemetry and deterministic probability modeling. Designed for quantitative syndicates, market makers, and analytical risk desks.
            </p>
            <div className="text-[10px] text-slate-400">
              PGP FINGERPRINT: 4A89 2F01 9B4C 8821 00E1 498A 7F12 90D4
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-1 text-[11px]">
            <div className="text-white font-bold mb-2 uppercase">[SYSTEM_STATUS]</div>
            <div>UPTIME: 99.994%</div>
            <div>SLATE_PIPELINE: PROD_ONLINE</div>
            <div>STATCAST_FEED: SYNCHRONIZED</div>
            <div>BAROMETRIC_GRID: 30/30 PARKS</div>
          </div>

          {/* Col 3 */}
          <div className="space-y-1 text-[11px]">
            <div className="text-white font-bold mb-2 uppercase">[COMPLIANCE]</div>
            <div>AUDIT_STANDARD: SHA-256</div>
            <div>LEDGER: ECDSA VERIFIED</div>
            <div>LICENSE: INSTITUTIONAL L3</div>
            <div className="text-emerald-400">ACCESS: GRANTED</div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400">
          <div>© 2026 VOUCHEDGE PLATFORMS INC. ALL RIGHTS RESERVED.</div>
          <div className="mt-2 sm:mt-0 flex gap-4">
            <span>TERMS // DETERMINISM</span>
            <span>API_GATEWAY</span>
            <span>SECURITY_DISCLOSURE</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
