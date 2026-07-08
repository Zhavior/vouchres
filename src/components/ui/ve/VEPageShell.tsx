import type { ReactNode } from 'react';

export function VEPageShell({ children }: { children: ReactNode }) {
  return (
    <main className="ve-page ve-grid min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
