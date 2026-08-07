import React, { useState, useEffect } from 'react';
import { AURORA_LABEL, AURORA_PANEL_PREMIUM, AURORA_SECTION_HEADER } from '../../../theme/auroraTokens';
import { Search, Shield, Ban, Clock, CheckCircle2, UserX } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

interface UserProfile {
  id: string;
  display_name: string;
  username: string;
  subscription_tier?: string;
  is_admin?: boolean;
  role?: string;
  created_at?: string;
}

export function UsersModule() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    }
    
    void loadUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    (user.display_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center`}>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search by name, email, or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
            Export CSV
          </button>
          <button className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
            Add User
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} overflow-hidden`}>
        <div className={`${AURORA_SECTION_HEADER} p-4 sm:p-5 border-b border-white/5`}>
          <h2 className={`${AURORA_LABEL} text-white`}>User Directory</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Tier</th>
                <th className="px-5 py-3 font-medium">Last Active</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-white/40">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-white/40">
                    No users found matching "{searchTerm}"
                  </td>
                </tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-white">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xs uppercase">
                        {(user.display_name || user.username || '?').substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium">{user.display_name || 'Anonymous'}</div>
                        <div className="text-xs text-white/40">@{user.username || user.id.substring(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-white/70">
                    <span className="capitalize">{user.role || (user.is_admin ? 'admin' : 'user')}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-vouch-emerald/10 text-vouch-emerald`}>
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="capitalize">Active</span>
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs">{user.subscription_tier || 'BASIC'}</span>
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-white/40 hover:text-white transition-colors p-1" title="View Profile">
                        <Search className="h-4 w-4" />
                      </button>
                      <button className="text-white/40 hover:text-indigo-400 transition-colors p-1" title="Manage Permissions">
                        <Shield className="h-4 w-4" />
                      </button>
                      <button className="text-white/40 hover:text-rose-400 transition-colors p-1" title="Suspend/Ban">
                        <UserX className="h-4 w-4" />
                      </button>
                    </div>
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
