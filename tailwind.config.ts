import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: 'var(--bg-obsidian)',
          900: 'var(--bg-obsidian)',
          800: 'var(--bg-graphite)',
          700: 'var(--bg-storm)',
          600: 'var(--surface-panel)',
        },
        graphite: 'var(--bg-graphite)',
        storm: 'var(--bg-storm)',
        ion: 'var(--ion-core)',
        flash: 'var(--lightning-flash)',
        voltage: 'var(--voltage-green)',
        locked: 'var(--locked-slate)',
        'surface-panel': 'var(--surface-panel)',
        'vouch-cyan': 'var(--ion-core)',
        'vouch-emerald': 'var(--voltage-green)',
        'vouch-amber': '#D99C4A',
        slate: { 950: 'var(--bg-obsidian)' },
      },
      borderColor: {
        fuse: 'var(--border-fuse)',
        charged: 'var(--border-charged)',
      },
      fontFamily: {
        // Headers, Slate Alpha, hero titles
        display: ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Small labels, table text, nav
        sans: ['Cabinet Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Odds, HRPI scores, timestamps
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        z8: ['Cabinet Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;
