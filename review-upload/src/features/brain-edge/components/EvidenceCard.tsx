interface EvidenceCardProps {
  title: string;
  items: string[];
}

export default function EvidenceCard({
  title,
  items,
}: EvidenceCardProps) {
  if (!items.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">
        {title}
      </h3>

      <ul className="space-y-2 text-sm text-white/70">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
