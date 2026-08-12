import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Aurora Max shell surfaces', () => {
  it('keeps the V mark and requests its emerald treatment in both navigation shells', () => {
    const logo = readFileSync('src/components/brand/VouchEdgeLogo.tsx', 'utf8');
    const sidebar = readFileSync('src/social/feed/FeedSidebar.tsx', 'utf8');
    const drawer = readFileSync('src/social/feed/MobileProfileDrawer.tsx', 'utf8');

    expect(logo).toContain('/vouchedge-mark-aurora.svg');
    expect(logo).toContain('emeraldMark');
    expect(sidebar).toContain('<VouchEdgeLogo emeraldMark');
    expect(drawer).toContain('<VouchEdgeLogo emeraldMark');
  });

  it('applies the Aurora Max contract to ParlayOS and World Chat', () => {
    const layer = readFileSync('src/components/parlay/os/ParlayOsLayer.tsx', 'utf8');
    const workspace = readFileSync('src/components/parlay/ParlayOsWorkspace.tsx', 'utf8');
    const widget = readFileSync('src/components/theEdge/WorldChatWidget.tsx', 'utf8');
    const panel = readFileSync('src/components/theEdge/WorldChatPanel.tsx', 'utf8');
    const styles = readFileSync('src/styles/shell-surfaces-aurora-max.css', 'utf8');

    expect(layer).toContain('parlay-os-aurora-max');
    expect(workspace).toContain('parlay-os-workspace-aurora-max');
    expect(widget).toContain('world-chat-aurora-max');
    expect(panel).toContain('world-chat-panel-aurora-max');
    expect(styles).toContain('border-radius: 0 !important');
  });
});
