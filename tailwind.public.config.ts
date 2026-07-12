import type { Config } from 'tailwindcss';
import baseConfig from './tailwind.config';

const config: Config = {
  ...baseConfig,
  content: [
    './src/App.tsx',
    './src/pages/VouchEdgeTerminalPage.tsx',
    './src/components/landing/**/*.{ts,tsx}',
    './src/components/vouch-studio-darkroom/panels/preview/*.{ts,tsx}',
  ],
};

export default config;
