type VESectionHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
};

export function VESectionHeader({ eyebrow, title, subtitle }: VESectionHeaderProps) {
  return (
    <header className="mb-8">
      <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
        {eyebrow}
      </div>
      <h1 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-6xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 max-w-3xl text-lg leading-8 text-white/55">
          {subtitle}
        </p>
      )}
    </header>
  );
}
