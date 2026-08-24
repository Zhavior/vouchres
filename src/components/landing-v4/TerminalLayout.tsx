import React from 'react';

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative overflow-hidden">
      {/* Global Background Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(49,181,131,0.03),transparent_70%)] pointer-events-none z-0" />
      
      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Global System Status Bar */}
      <div className="fixed bottom-0 left-0 w-full p-2 border-t border-white/5 bg-black/60 backdrop-blur-md z-50 flex justify-between items-center px-6">
        <div className="terminal-text flex gap-4">
          <span className="text-ve-emerald animate-pulse">● SYSTEM_LIVE</span>
          <span>NODE: PROXIMA_01</span>
        </div>
        <div className="terminal-text">
          {new Date().toLocaleTimeString()} UTC
        </div>
      </div>
    </div>
  );
}
