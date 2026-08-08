import React, { useState, useEffect } from 'react';
import { AURORA_LABEL, AURORA_PANEL_PREMIUM, AURORA_SECTION_HEADER } from '../../../theme/auroraTokens';
import { History, Search, Shield, ShieldAlert, Plus } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

interface AdminProfile {
  id: string;
  display_name: string;
  username: string;
  is_staff?: boolean;
  created_at?: string;
}

export function AdminModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reads go through the staff-gated API — public.profiles is revoked from
    // anon/authenticated. Note the previous query filtered on `is_admin`, a
    // column that does not exist in any migration; the staff flag is `is_staff`.
    async function loadAdmins() {
      try {
        const payload = await apiClient.get<{ users: AdminProfile[] }>(
          '/api/admin/users',
          { limit: 200 },
        );
        setAdmins((payload?.users ?? []).filter((u) => u.is_staff));
      } catch (err) {
        console.error('Error fetching admins:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadAdmins();
  }, []);

  const filteredAdmins = admins.filter(admin => 
    (admin.display_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (admin.username?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center`}>
        <div>
          <h2 className={`${AURORA_LABEL} text-white flex items-center gap-2`}>
            <Shield className="h-4 w-4" /> Aurora HQ Access Control
          </h2>
          <p className="text-xs text-white/50 mt-1">Manage who has access to the internal operating system.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search admins..." 
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" /> Invite Admin
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Admin Roster */}
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} overflow-hidden lg:col-span-2`}>
          <div className={`${AURORA_SECTION_HEADER} p-4 sm:p-5 border-b border-white/5`}>
            <h2 className={`${AURORA_LABEL} text-white`}>Active Administrators</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/70">
              <thead className="bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-5 py-3 font-medium">Administrator</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium">MFA Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-white/40">
                    Loading admin roster...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-white/40">
                    No admins found matching "{searchTerm}"
                  </td>
                </tr>
              ) : filteredAdmins.map(admin => (
                <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-white">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300 font-bold text-xs uppercase">
                        {(admin.display_name || admin.username || '?').substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium">{admin.display_name || 'Anonymous'}</div>
                        <div className="text-xs text-white/40">@{admin.username || admin.id.substring(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400`}>
                      <Shield className="h-3 w-3" />
                      Staff
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs">
                    {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-vouch-emerald">
                      <ShieldAlert className="h-3 w-3" /> Enabled
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Roles & Audit */}
        <div className="space-y-6">
          <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5`}>
            <div className={`${AURORA_SECTION_HEADER} mb-5 border-b border-white/5 pb-4`}>
              <h2 className={`${AURORA_LABEL} text-white`}>Role Definitions</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-vouch-emerald flex items-center gap-1">Super Admin</h4>
                <p className="text-xs text-white/50 mt-1">Full access to all Aurora HQ modules, including destructive actions.</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1">Support Admin</h4>
                <p className="text-xs text-white/50 mt-1">Read-only access to User Directory and Support Tickets. Cannot edit billing.</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1">Billing Admin</h4>
                <p className="text-xs text-white/50 mt-1">Access to Billing and Analytics only. Can issue refunds via Stripe.</p>
              </div>
            </div>
          </div>

          <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5`}>
            <div className={`${AURORA_SECTION_HEADER} mb-5 border-b border-white/5 pb-4`}>
              <h2 className={`${AURORA_LABEL} text-white flex items-center gap-2`}>
                <History className="h-4 w-4" /> Admin Audit Log
              </h2>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-vouch-cyan font-medium">Boyd Santos</span> <span className="text-white/60">issued a refund for</span> <span className="text-white">usr_104</span>
                <div className="text-xs text-white/40 mt-0.5">2 hours ago</div>
              </div>
              <div className="text-sm">
                <span className="text-vouch-cyan font-medium">System</span> <span className="text-white/60">enforced MFA for all roles</span>
                <div className="text-xs text-white/40 mt-0.5">1 day ago</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
