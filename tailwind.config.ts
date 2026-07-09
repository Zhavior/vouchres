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
          900: '#050505',
          800: '#0A0A0A',
          700: '#121212',
          600: '#1A1A1A',
        },
        graphite: 'var(--bg-graphite)',
        storm: 'var(--bg-storm)',
        ion: 'var(--ion-core)',
        flash: 'var(--lightning-flash)',
        voltage: 'var(--voltage-green)',
        locked: 'var(--locked-slate)',
        'surface-panel': 'var(--surface-panel)',
        'vouch-cyan': '#00F0FF',
        'vouch-emerald': '#00FF94',
        'vouch-amber': '#f59e0b',
        slate: { 950: '#0A0A0A' },
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
