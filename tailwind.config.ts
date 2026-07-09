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
        'vouch-amber': '#f59e0b',
        slate: { 950: 'var(--bg-obsidian)' },
      },
      borderColor: {
        fuse: 'var(--border-fuse)',
        charged: 'var(--border-charged)',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        z8: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
