import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const viteConfig = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
const authModal = readFileSync(new URL('../src/components/auth/AuthModal.tsx', import.meta.url), 'utf8');

describe('public landing SEO foundations', () => {
  it('declares the intended crawlable homepage metadata', () => {
    expect(indexHtml).toContain('VouchEdge — Sports Research, Home Run Intelligence and Parlay Tracking');
    expect(indexHtml).toContain('Research MLB matchups, compare hitters and pitchers, track parlays, and review verified betting results with VouchEdge.');
    expect(indexHtml).toContain('rel="canonical"');
    expect(indexHtml).toContain('property="og:url"');
    expect(indexHtml).toContain('name="twitter:card"');
    expect(indexHtml).toContain('name="robots" content="index, follow"');
  });

  it('uses the canonical scroll lock for the auth modal and builds crawl files from the public site URL', () => {
    expect(authModal).toContain('useBodyScrollLock(open)');
    expect(viteConfig).toContain('VITE_PUBLIC_SITE_URL');
    expect(viteConfig).toContain("'dist', 'robots.txt'");
    expect(viteConfig).toContain("'dist', 'sitemap.xml'");
  });
});
