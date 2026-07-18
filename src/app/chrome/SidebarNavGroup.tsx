/**
 * Accessible collapsible nav group — Radix Collapsible + Z8 sidebar visuals.
 */
import React from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import {
  Z8_LABEL, Z8_SIDEBAR_PANEL,
} from '../../theme/z8Tokens';

const GROUP_ACCENT: Record<string, string> = {
  Daily: 'text-vouch-cyan',
  'Pro Labs': 'text-vouch-cyan',
  AI: 'text-vouch-cyan',
  'Build & Track': 'text-vouch-cyan',
  Social: 'text-vouch-cyan',
  Account: 'text-white/40',
};

export type SidebarNavGroupProps = {
  group: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemCount: number;
  hasActive: boolean;
  children: React.ReactNode;
};

export const SidebarNavGroup = React.memo(function SidebarNavGroup({
  group,
  open,
  onOpenChange,
  itemCount,
  hasActive,
  children,
}: SidebarNavGroupProps) {
  const accentClass = GROUP_ACCENT[group] || 'text-white/40';

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={onOpenChange}
      className={[
        'transition-all overflow-hidden',
        Z8_SIDEBAR_PANEL,
        hasActive ? 'shadow-[0_0_24px_rgba(0,240,255,0.08)]' : '',
      ].join(' ')}
    >
      <Collapsible.Trigger
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-vouch-cyan/5 outline-none ${Z8_LABEL}`}
      >
        <span className={['hidden xl:block', accentClass].join(' ')}>
          {group}
        </span>
        <span className="xl:hidden flex items-center justify-center w-5 h-5 bg-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <span className={['block w-1.5 h-1.5 bg-current', accentClass].join(' ')} />
        </span>
        <span className="hidden xl:flex items-center gap-1.5">
          <span className="text-[9px] text-white/30">
            {itemCount}
          </span>
          <ChevronDown
            className={[
              'h-3 w-3 text-white/40 transition-transform',
              open ? 'rotate-0' : '-rotate-90',
            ].join(' ')}
          />
        </span>
      </Collapsible.Trigger>

      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-none">
        <div className="px-2 pb-2.5 pt-2 space-y-1">
          {children}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
});
