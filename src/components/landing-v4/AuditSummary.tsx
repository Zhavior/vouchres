import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Activity, Database } from 'lucide-react';

export default function AuditSummary() {
  const stats = [
    { label: 'TOTAL_AUDITS', val: '12,402', icon: Database },
    { label: 'MODEL_ACCURACY', val: '64.2%', icon: ShieldCheck, color: 'text-ve-emerald' },
    { label: 'AVG_EDGE_DETECTED', val: '+4.8%', icon: Activity, color: 'text-ve-cyan' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-panel p-6 border-white/5 flex items-center justify-between"
        >
          <div>
            <p className="terminal-text mb-2">{stat.label}</p>
            <p className={`text-3xl font-bold tracking-tighter italic ${stat.color || 'text-white'}`}>
              {stat.val}
            </p>
          </div>
          <stat.icon size={24} className="text-white/10" />
        </motion.div>
      ))}
    </div>
  );
}
