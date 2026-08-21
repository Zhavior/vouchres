import React from 'react';
import { NflTouchdownShell } from '../components/NflTouchdownShell';

export function NflTouchdownPage() {
  return (
    <main className="ve-page-shell flex h-full w-full flex-col overflow-x-clip bg-ve-obsidian/75">
      <NflTouchdownShell />
    </main>
  );
}

export default NflTouchdownPage;
