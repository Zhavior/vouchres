export const IntelligenceGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20 border-t border-white/10">
    {['Matchup', 'AI Models', 'Ledger'].map((n) => (
      <div key={n} className="p-8 border border-white/10 bg-white/5 rounded-sm">
        <h3 className="text-xl font-bold mb-2">{n}</h3>
        <p className="text-white/40 text-sm">Institutional grade data analysis.</p>
      </div>
    ))}
  </div>
);
