import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

/**
 * The gallery ships real screenshots. A slug with no file on disk renders a
 * broken frame on the landing page, which is worse than showing nothing — so
 * the reference and the asset are checked against each other here.
 */
describe('landing product gallery', () => {
  const source = readFileSync('src/components/landing-v4/ProductGallery.tsx', 'utf8');
  const slugs = [...source.matchAll(/slug: '([a-z0-9-]+)'/g)].map((match) => match[1]);

  it('references at least one surface', () => {
    expect(slugs.length).toBeGreaterThan(0);
  });

  it('has a desktop and a mobile capture for every slug', () => {
    for (const slug of slugs) {
      expect(existsSync(`public/media/features/${slug}.webp`), `${slug}.webp missing`).toBe(true);
      expect(existsSync(`public/media/features/${slug}-mobile.webp`), `${slug}-mobile.webp missing`).toBe(true);
    }
  });

  it('describes every shot for screen readers', () => {
    // Alt strings use whichever quote the text needs, so match both.
    expect([...source.matchAll(/alt: ['"]/g)].length).toBe(slugs.length);
  });
});
