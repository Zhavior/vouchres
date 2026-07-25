interface RiskSummaryProps {
  risks: string[];
}

export default function RiskSummary({
  risks,
}: RiskSummaryProps) {
  if (!risks.length) return null;

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
      <h3 className="mb-3 text-sm font-semibold text-red-300">
        Risk Summary
      </h3>

      <ul className="space-y-2 text-sm text-red-200">
        {risks.map((risk) => (
          <li key={risk}>• {risk}</li>
        ))}
      </ul>
    </div>
  );
}
