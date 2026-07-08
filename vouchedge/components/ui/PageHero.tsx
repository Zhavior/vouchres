export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-6 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-300">
        {eyebrow}
      </div>
      <h1 className="max-w-5xl text-6xl md:text-8xl font-black uppercase leading-[0.9] tracking-tighter">
        {title}
      </h1>
      <p className="mt-8 max-w-2xl text-lg leading-8 text-white/55">
        {subtitle}
      </p>
    </section>
  );
}
