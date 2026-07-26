import type { PropsWithChildren } from 'react';
import { ChevronDown } from 'lucide-react';

interface AuroraDisclosureProps extends PropsWithChildren {
  id: string;
  title: string;
  detail: string;
}

export function AuroraDisclosure({ id, title, detail, children }: AuroraDisclosureProps) {
  return (
    <details id={id} className="group border border-white/10 bg-black/25 open:bg-black/35">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vouch-cyan/80 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-sm font-bold text-white">{title}</span>
          <span className="mt-0.5 block text-xs leading-5 text-white/45">{detail}</span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-white/45 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
      </summary>
      <div className="border-t border-white/10 p-3 sm:p-5">{children}</div>
    </details>
  );
}
