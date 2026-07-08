export const Pricing = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20">
    {['Free', 'Pro', 'Capper'].map((n) => (
      <div key={n} className="p-8 border border-white/10 bg-white/5 rounded-sm">
        <h3 className="text-2xl font-bold mb-4">{n}</h3>
        <div className="text-emerald font-mono text-xl mb-6">$0.00</div>
        <button className="w-full py-3 bg-emerald text-black font-bold uppercase text-[10px]">Select</button>
      </div>
    ))}
  </div>
);
