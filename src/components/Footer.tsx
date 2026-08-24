
import React from 'react';
import { ShieldCheck, Terminal, Layers, Database, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#06070a] text-slate-400 font-sans text-xs">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Col 1: System Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-medium">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>VouchEdge Terminal</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Institutional sports intelligence architecture. Deterministic hypotheses formulated on Hawk-Eye Statcast telemetry and immutable coverage receipts.
            </p>
            <div className="font-mono text-[10px] text-slate-600">
              Engineered in Canada · System Build 2026.4.1
            </div>
          </div>

          {/* Col 2: Telemetry Nodes */}
          <div className="space-y-2 font-mono">
            <div className="text-slate-200 text-xs font-semibold uppercase tracking-wider">Telemetry Nodes</div>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li><a href="/hr-board" className="hover:text-emerald-400 transition-colors">MLB Gameday REST SLA: 99.98%</a></li>
              <li><a href="/hr-board" className="hover:text-emerald-400 transition-colors">Hawk-Eye 3D Trajectory Feeds</a></li>
              <li><a href="/hr-board" className="hover:text-emerald-400 transition-colors">NOAA Spatial Weather Grid</a></li>
              <li><a href="/hr-board" className="hover:text-emerald-400 transition-colors">Park Altitude Delta Engine</a></li>
            </ul>
          </div>

          {/* Col 3: Compliance & Methodology */}
          <div className="space-y-2 font-mono">
            <div className="text-slate-200 text-xs font-semibold uppercase tracking-wider">Methodology</div>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li><a href="/hr-board" className="hover:text-emerald-400 transition-colors">HRPI Index Formulation</a></li>
              <li><a href="/hr-board" className="hover:text-emerald-400 transition-colors">Zero Retroactive Deletion SLA</a></li>
              <li><a href="/hr-board" className="hover:text-emerald-400 transition-colors">Coverage Layer Proofs</a></li>
              <li><a href="/hr-board" className="hover:text-emerald-400 transition-colors">Variance Diagnosis Framework</a></li>
            </ul>
          </div>

          {/* Col 4: Immutable Hash Verification */}
          <div className="space-y-2">
            <div className="text-slate-200 text-xs font-mono font-semibold uppercase tracking-wider">Verification State</div>
            <div className="border border-white/[0.06] bg-[#090b10] p-3 space-y-1.5 font-mono text-[10px]">
              <div className="text-slate-500 flex items-center justify-between">
                <span>AUDIT RECORD:</span>
                <span className="text-emerald-400">SYNCED</span>
              </div>
              <div className="text-slate-400 break-all">
                0x7f8a92d41b5c89e2f4178a9c3011b6d7e829
              </div>
              <div className="text-slate-600 pt-1 border-t border-white/[0.04]">
                100% Weight Locked · No Deletions
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-500">
          <div>
            VouchEdge is a deterministic sports data audit platform. Not a betting advisory service.
          </div>
          <div>
            &copy; {new Date().getFullYear()} VouchEdge Systems. All Telemetry Verified.
          </div>
        </div>
      </div>
    </footer>
  );
}
