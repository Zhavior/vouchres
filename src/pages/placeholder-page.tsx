import { cn } from "@/lib/utils";

export function PlaceholderPage({ title, description, icon: Icon, phase }: {
  title: string; description: string; icon: any; phase: string;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold flex items-center gap-2"><Icon className="w-5 h-5" style={{ color: "var(--ve-accent)" }} /> {title}</h1>
      </div>
      <div className="ve-card p-8 text-center flex flex-col items-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full blur-xl" style={{ background: "var(--ve-badge-bg)" }} />
          <Icon className="w-10 h-10 relative" strokeWidth={1.5} style={{ color: "var(--ve-accent)", opacity: 0.5 }} />
        </div>
        <h3 className="text-sm font-semibold">{title} — {phase}</h3>
        <p className="mt-1 text-xs max-w-xs" style={{ color: "var(--ve-text-muted)" }}>{description}</p>
      </div>
    </div>
  );
}
