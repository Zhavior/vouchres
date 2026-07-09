import { Flame } from 'lucide-react';

type HrBrandIconSize = 'sm' | 'md';

const SIZE_CLASSES: Record<HrBrandIconSize, { box: string; icon: string }> = {
  sm: { box: 'h-10 w-10', icon: 'h-4 w-4' },
  md: { box: 'h-11 w-11', icon: 'h-5 w-5' },
};

export interface HrBrandIconProps {
  size?: HrBrandIconSize;
  className?: string;
}

export function HrBrandIcon({ size = 'md', className = '' }: HrBrandIconProps) {
  const sizes = SIZE_CLASSES[size];

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center border border-vouch-cyan/35 bg-vouch-cyan/10 ${sizes.box} ${className}`}
      aria-hidden="true"
    >
      <Flame className={`${sizes.icon} text-vouch-cyan`} strokeWidth={2.25} />
      <div className="absolute inset-0 -z-10 bg-vouch-cyan/10 blur-md" />
    </div>
  );
}

export default HrBrandIcon;
