/**
 * Mobile navigation drawer shell — Vaul (open-source) + Z8 chrome.
 * Content stays in MobileProfileDrawer; this owns a11y focus trap / overlay / slide.
 */
import React from 'react';
import { Drawer } from 'vaul';
import { Z8_SIDEBAR_SHELL } from '../../theme/z8Tokens';

export type MobileNavDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
};

export function MobileNavDrawer({
  open,
  onOpenChange,
  title = 'Navigation menu',
  children,
}: MobileNavDrawerProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="left"
      shouldScaleBackground={false}
      modal
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm md:hidden" />
        <Drawer.Content
          className={`fixed inset-y-0 left-0 z-[91] flex w-[82vw] max-w-[320px] flex-col outline-none md:hidden ${Z8_SIDEBAR_SHELL} shadow-[4px_0_40px_rgba(0,0,0,0.45)]`}
          aria-describedby={undefined}
        >
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
