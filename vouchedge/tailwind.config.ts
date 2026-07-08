import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}","./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { obsidian: '#0A0A0A', emerald: '#00E5FF', slate: { 950: '#161616' } },
    },
  },
  plugins: [],
};
export default config;
