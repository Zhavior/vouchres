type VouchEdgeLogoProps = {
  className?: string;
  markClassName?: string;
  showBeta?: boolean;
  /** Lets tight headers hide the beta pill responsively without dropping it entirely. */
  betaClassName?: string;
  emeraldMark?: boolean;
};

export default function VouchEdgeLogo({
  className = '',
  markClassName = 'h-10 w-10',
  showBeta = false,
  betaClassName = '',
  emeraldMark = false,
}: VouchEdgeLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/vouchedge-mark-aurora.svg"
        alt=""
        className={`${markClassName} ${emeraldMark ? 've-logo-mark--emerald' : ''} shrink-0 object-contain`}
      />
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-lg font-black tracking-[-0.04em] text-white">VouchEdge</span>
        {showBeta && (
          <span
            className={`whitespace-nowrap rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-200 ${betaClassName}`}
          >
            Open Beta
          </span>
        )}
      </span>
    </span>
  );
}
