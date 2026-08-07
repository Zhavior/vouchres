import React from 'react';
import { AURORA_LABEL, AURORA_PANEL_PREMIUM, AURORA_SECTION_HEADER } from '../../../theme/auroraTokens';
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, RefreshCw, FileText } from 'lucide-react';

const RECENT_TRANSACTIONS = [
  { id: 'tx_1', user: 'Alice Chen', amount: '$7.99', status: 'succeeded', date: '10 mins ago', plan: 'VouchEdge Beta (Monthly)' },
  { id: 'tx_2', user: 'Bob Smith', amount: '$7.99', status: 'failed', date: '1 hour ago', plan: 'VouchEdge Beta (Monthly)' },
  { id: 'tx_3', user: 'Charlie Davis', amount: '$79.99', status: 'succeeded', date: '2 hours ago', plan: 'VouchEdge Beta (Annual)' },
];

export function BillingModule() {
  return (
    <div className="space-y-6">
      
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Monthly Recurring Revenue</span>
            <DollarSign className="h-4 w-4 text-vouch-emerald" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">$42,500</h3>
            <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-vouch-emerald" /> 12% vs last month
            </p>
          </div>
        </div>
        
        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Active Subscriptions</span>
            <CreditCard className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">4,892</h3>
            <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-vouch-emerald" /> 5% vs last month
            </p>
          </div>
        </div>

        <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} p-4 sm:p-5 flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <span className={`${AURORA_LABEL} text-white/50`}>Churn Rate</span>
            <RefreshCw className="h-4 w-4 text-rose-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">2.4%</h3>
            <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
              <ArrowDownRight className="h-3 w-3 text-vouch-emerald" /> 0.2% vs last month
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> Open Stripe Dashboard
        </button>
        <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
          Manage Plans
        </button>
        <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
          Coupons
        </button>
      </div>

      {/* Transactions Table */}
      <div className={`rounded-xl ${AURORA_PANEL_PREMIUM} overflow-hidden`}>
        <div className={`${AURORA_SECTION_HEADER} p-4 sm:p-5 border-b border-white/5`}>
          <h2 className={`${AURORA_LABEL} text-white`}>Recent Transactions</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {RECENT_TRANSACTIONS.map(tx => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-white font-medium">{tx.user}</td>
                  <td className="px-5 py-3 text-white/60">{tx.plan}</td>
                  <td className="px-5 py-3">{tx.amount}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.status === 'succeeded' ? 'bg-vouch-emerald/10 text-vouch-emerald' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      <span className="capitalize">{tx.status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs">{tx.date}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-white/40 hover:text-white transition-colors p-1" title="View Invoice">
                      <FileText className="h-4 w-4" />
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
