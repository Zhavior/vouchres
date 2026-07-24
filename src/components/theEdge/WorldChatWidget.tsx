import React, { Suspense, lazy, useEffect, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useAppProfile } from '../../context/AppShellContext';
import { Z8_SURFACE, Z8_ACTIVE, Z8_OVERLAY_SCRIM } from '../../theme/z8Tokens';
import { useParlayOsStore } from '../../stores/parlayOsStore';
import { useNavUiStore } from '../../stores/navUiStore';

const WorldChatPanel = lazy(() => import('./WorldChatPanel'));

export default function WorldChatWidget() {
  const profile = useAppProfile();
  const [isOpen, setIsOpen] = useState(false);
  const parlayDockOpen = useParlayOsStore((state) => state.sheetOpen);
  const setWorldChatOpen = useNavUiStore((state) => state.setWorldChatOpen);

  useEffect(() => {
    if (parlayDockOpen) setIsOpen(false);
  }, [parlayDockOpen]);

  useEffect(() => {
    setWorldChatOpen(isOpen);
    return () => setWorldChatOpen(false);
  }, [isOpen, setWorldChatOpen]);

  const hideFab = parlayDockOpen;

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close World Chat"
          onClick={() => setIsOpen(false)}
          className={`fixed inset-0 z-[90] ${Z8_OVERLAY_SCRIM}`}
        />
      ) : null}

      {isOpen ? (
        <div
          className={[
            'pointer-events-auto fixed z-[91] overflow-hidden rounded-2xl border border-white/10 shadow-2xl',
            Z8_SURFACE,
            'inset-x-4 top-[max(0.75rem,env(safe-area-inset-top))] bottom-36',
            'md:inset-x-auto md:bottom-24 md:right-6 md:top-auto md:left-auto',
            'md:h-[min(85vh,860px)] md:min-h-[480px] md:w-[min(420px,calc(100vw-2rem))]',
            'animate-in fade-in zoom-in-95 duration-200',
          ].join(' ')}
        >
          <div className="flex h-12 items-center justify-between border-b border-ve-charged/40 bg-ve-obsidian/80 px-4 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white">World Chat Live</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close World Chat"
              className="rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative h-[calc(100%-3rem)] bg-ve-obsidian/60 backdrop-blur-md">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-widest text-white/40">
                  Loading chat…
                </div>
              }
            >
              <WorldChatPanel profile={profile} isLoggedIn={true} />
            </Suspense>
          </div>
        </div>
      ) : null}

      <div
        className={`fixed bottom-36 right-4 z-[92] transition-opacity duration-150 md:bottom-6 md:right-6 ${
          hideFab ? 'invisible opacity-0 md:visible md:opacity-100' : 'visible opacity-100'
        } ${hideFab ? '' : 'lg:bottom-24'}`}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close World Chat' : 'Open World Chat'}
          aria-expanded={isOpen}
          className={`flex h-12 w-12 items-center justify-center rounded-full border border-ve-charged shadow-ve-glow-cyan transition-all hover:scale-105 active:scale-95 sm:h-14 sm:w-14 ${
            isOpen ? 'hidden bg-ve-storm/80 text-white md:flex' : `flex ${Z8_ACTIVE} font-bold text-black`
          }`}
        >
          {isOpen ? (
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </button>
      </div>
    </>
  );
}
