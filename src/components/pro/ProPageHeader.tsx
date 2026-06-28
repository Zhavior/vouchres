type ProPageHeaderProps = {
  title: string;
  subtitle: string;
  badge?: string;
};

export function ProPageHeader({ title, subtitle, badge = 'Pro Research' }: ProPageHeaderProps) {
  return (
    <div className="rounded-3xl border border-sky-400/15 bg-gradient-to-br from-slate-950 via-slate-950 to-sky-950/30 p-5 shadow-[0_0_50px_rgba(14,165,233,0.08)]">
      <div className="mb-3 inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-sky-200">
        {badge}
      </div>
      <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{subtitle}</p>
    </div>
  );
}

export default ProPageHeader;
