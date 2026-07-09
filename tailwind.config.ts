import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          900: '#050505',
          800: '#0A0A0A',
          700: '#121212',
          600: '#1A1A1A',
        },
        'vouch-cyan': '#00F0FF',
        'vouch-emerald': '#00FF94',
        'vouch-amber': '#f59e0b',
        slate: { 950: '#0A0A0A' },
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
