import React from 'react';
import { AURORA_LABEL, AURORA_PANEL_PREMIUM, AURORA_SECTION_HEADER } from '../../../theme/auroraTokens';
import { Shield, Lock, FileKey, Globe2, Fingerprint, EyeOff } from 'lucide-react';

export function PrivacyModule() {
  return (
    <div className="space-y-6">
      
      {/* Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>GDPR / CCPA Status</span>
            <Shield className="h-4 w-4 text-vouch-emerald" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-vouch-emerald">Compliant</h3>
            <p className="text-xs text-white/40 mt-1">Aurora Trust Engine active</p>
          </div>
        </div>

        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Pending Data Exports</span>
            <FileKey className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">4</h3>
            <p className="text-xs text-white/40 mt-1">Processing via queue</p>
          </div>
        </div>

        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Deletion Requests</span>
            <EyeOff className="h-4 w-4 text-rose-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">12</h3>
            <p className="text-xs text-white/40 mt-1">Within 30-day window</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trust Engine Settings */}
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5`}>
          <div className={`${AURORA_SECTION_HEADER} mb-5 border-b border-white/5 pb-4`}>
            <h2 className={`${AURORA_LABEL} text-white`}>Aurora Trust Engine</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-vouch-emerald/10 flex items-center justify-center">
                <Globe2 className="h-5 w-5 text-vouch-emerald" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Global Privacy Control (GPC)</h4>
                <p className="text-xs text-white/50 mt-1">Automatically respects the GPC signal from user browsers to opt-out of data sales.</p>
                <div className="mt-2 text-[10px] uppercase font-bold text-vouch-emerald bg-vouch-emerald/10 w-fit px-2 py-0.5 rounded">Enabled</div>
              </div>
            </div>

            <div className="flex items-start gap-4 pt-4 border-t border-white/5">
              <div className="h-10 w-10 shrink-0 rounded-full bg-vouch-cyan/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-vouch-cyan" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">AI Training Opt-Out Default</h4>
                <p className="text-xs text-white/50 mt-1">Ensures new users are opted out of AI data training by default to comply with strict EU standards.</p>
                <div className="mt-2 text-[10px] uppercase font-bold text-vouch-cyan bg-vouch-cyan/10 w-fit px-2 py-0.5 rounded">Enabled</div>
              </div>
            </div>
            
            <div className="flex items-start gap-4 pt-4 border-t border-white/5">
              <div className="h-10 w-10 shrink-0 rounded-full bg-white/5 flex items-center justify-center">
                <Fingerprint className="h-5 w-5 text-white/40" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">Advanced Telemetry Anonymization</h4>
                <p className="text-xs text-white/50 mt-1">Strips all PII from VouchEdge telemetry events before sending to external aggregators.</p>
                <button className="mt-2 text-[10px] uppercase font-bold text-white/50 bg-white/5 hover:bg-white/10 transition-colors w-fit px-2 py-1 rounded">Configure</button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Subject Requests (DSR) */}
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} overflow-hidden flex flex-col`}>
          <div className={`${AURORA_SECTION_HEADER} p-4 sm:p-5 border-b border-white/5`}>
            <h2 className={`${AURORA_LABEL} text-white`}>Data Subject Requests (DSR)</h2>
          </div>
          
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center items-center text-center opacity-70">
            <Shield className="h-12 w-12 text-white/20 mb-4" />
            <h3 className="text-sm font-medium text-white">All requests fulfilled</h3>
            <p className="text-xs text-white/40 mt-1 max-w-xs">There are no pending manual Data Subject Requests. The Aurora Trust Engine is handling automated requests.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
