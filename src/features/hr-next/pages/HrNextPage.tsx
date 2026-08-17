import { HrNextShell } from '../components/HrNextShell';

export function HrNextPage() {
  return (
    // `overflow-x-clip` rather than `overflow-hidden`: hidden makes this element
    // a scrollport, and because the real scrolling happens further up the tree
    // (`.ve-scroll-pane`), that scrollport never scrolls — which silently kills
    // `position: sticky` for everything inside, the toolbar and the research
    // dock included. `clip` stops the same horizontal bleed without creating a
    // scroll container, so sticky resolves against the pane that actually moves.
    <main className="ve-page-shell flex h-full w-full flex-col overflow-x-clip bg-ve-obsidian">
      <HrNextShell />
    </main>
  );
}

export default HrNextPage;
