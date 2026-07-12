import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const shellCss = readFileSync('src/styles/z8-premium.css', 'utf8');
const feedCss = readFileSync('src/styles/legacy/feed-stream.css', 'utf8');
const sidebarSource = readFileSync('src/social/feed/FeedSidebar.tsx', 'utf8');

describe('sidebar and full-page boundary', () => {
  it('uses one responsive sidebar width for the shell columns', () => {
    expect(shellCss).toContain('--ve-sidebar-width: 72px');
    expect(shellCss).toContain('--ve-sidebar-width: 280px');
    expect(shellCss).toContain('grid-template-columns: var(--ve-sidebar-width) minmax(0,1fr)');
  });

  it('keeps the feed shell on the same width contract', () => {
    expect(feedCss).toContain('grid-template-columns: var(--ve-sidebar-width) minmax(0, 600px) 290px');
    expect(feedCss).not.toContain('grid-template-columns: 260px minmax(0, 600px) 290px');
  });

  it('prevents the sidebar from exceeding its reserved grid column', () => {
    expect(sidebarSource).toContain("'w-full min-w-0'");
    expect(sidebarSource).not.toContain("'w-[72px] xl:w-[280px]'");
  });
});
