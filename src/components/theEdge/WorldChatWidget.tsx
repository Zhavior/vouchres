import React, { useEffect, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useAppProfile } from '../../context/AppShellContext';
import WorldChatPanel from './WorldChatPanel';
import { Z8_SURFACE, Z8_ACTIVE, Z8_OVERLAY_SCRIM } from '../../theme/z8Tokens';
import { AnimatePresence, motion } from 'framer-motion';
import { useParlayOsStore } from '../../stores/parlayOsStore';
import { useNavUiStore } from '../../stores/navUiStore';

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
      <AnimatePresence>
        {isOpen && (
          <motion.button
            type="button"
            aria-label="Close World Chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className={`fixed inset-0 z-[90] ${Z8_OVERLAY_SCRIM}`}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={[
              'pointer-events-auto fixed z-[91] overflow-hidden rounded-2xl border border-white/10 shadow-2xl',
              Z8_SURFACE,
              'inset-x-4 top-[max(0.75rem,env(safe-area-inset-top))] bottom-36',
              'md:inset-x-auto md:bottom-24 md:right-6 md:top-auto md:left-auto',
              'md:h-[min(85vh,860px)] md:min-h-[480px] md:w-[min(420px,calc(100vw-2rem))]',
            ].join(' ')}
          >
            <div className="flex h-12 items-center justify-between border-b border-white/10 bg-black/40 px-4 backdrop-blur-md">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">World Chat</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close World Chat"
                className="rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative h-[calc(100%-3rem)] bg-black/60">
              <WorldChatPanel profile={profile} isLoggedIn={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 sm:h-14 sm:w-14 ${
            isOpen ? 'hidden bg-white/10 text-white md:flex' : `flex ${Z8_ACTIVE} text-black`
          }`}
        >
          {isOpen ? (
            <X className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
          ) : (
            <MessageSquare className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
          )}
        </button>
      </div>
    </>
  );
}
