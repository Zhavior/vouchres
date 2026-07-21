import React, { useEffect, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useAppProfile } from '../../context/AppShellContext';
import WorldChatPanel from './WorldChatPanel';
import { Z8_PANEL_PREMIUM, Z8_SURFACE, Z8_LABEL, Z8_ACTIVE } from '../../theme/z8Tokens';
import { AnimatePresence, motion } from 'framer-motion';
import { useParlayOsStore } from '../../stores/parlayOsStore';
import { useNavUiStore } from '../../stores/navUiStore';

export default function WorldChatWidget() {
  const profile = useAppProfile();
  const [isOpen, setIsOpen] = useState(false);
  // ParlayOS's floating FAB/dock shares this corner. On desktop it's just a
  // small FAB, so chat only dodges upward. On mobile the dock is a
  // near-full-screen sheet, so chat has to disappear entirely instead.
  const parlayDockOpen = useParlayOsStore((state) => state.sheetOpen);
  const setWorldChatOpen = useNavUiStore((state) => state.setWorldChatOpen);

  useEffect(() => {
    if (parlayDockOpen) setIsOpen(false);
  }, [parlayDockOpen]);

  // Mirror local open state into the shared store so the mobile bottom nav
  // pill can hide itself while World Chat is open.
  useEffect(() => {
    setWorldChatOpen(isOpen);
    return () => setWorldChatOpen(false);
  }, [isOpen, setWorldChatOpen]);

  return (
    <div
      className={`fixed bottom-36 right-4 z-[95] transition-opacity duration-150 md:bottom-6 md:right-6 md:z-50 ${
        parlayDockOpen ? 'invisible opacity-0 md:visible md:opacity-100' : 'visible opacity-100'
      } ${parlayDockOpen ? '' : 'lg:bottom-24'} flex flex-col items-end pointer-events-none`}
    >
      
      <AnimatePresence>
        {isOpen && (
          <button
            type="button"
            aria-label="Close World Chat"
            onClick={() => setIsOpen(false)}
            className="pointer-events-auto fixed inset-0 z-0 bg-black/75 backdrop-blur-md md:hidden"
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
            className={`pointer-events-auto fixed inset-x-4 top-[max(0.75rem,env(safe-area-inset-top))] bottom-36 shadow-2xl rounded-2xl overflow-hidden border border-white/10 md:static md:inset-auto md:mb-4 md:w-[calc(100vw-2rem)] md:max-w-[420px] md:h-[min(85vh,860px)] md:min-h-[480px] ${Z8_SURFACE}`}
          >
            {/* Header / Draggable Area */}
            <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/40 backdrop-blur-md">
              <h3 className="font-bold text-sm text-white tracking-widest uppercase">World Chat</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="h-[calc(100%-3rem)] bg-black/60 relative">
              <WorldChatPanel profile={profile} isLoggedIn={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${
          isOpen ? 'hidden md:flex bg-white/10 text-white' : 'flex ' + Z8_ACTIVE + ' text-black'
        }`}
      >
        {isOpen ? <X className="w-4.5 h-4.5 sm:w-6 sm:h-6" /> : <MessageSquare className="w-4.5 h-4.5 sm:w-6 sm:h-6" />}
      </button>
    </div>
  );
}
