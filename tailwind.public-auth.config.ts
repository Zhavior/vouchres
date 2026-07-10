import type { Config } from 'tailwindcss';
import baseConfig from './tailwind.config';

const config: Config = {
  ...baseConfig,
  content: ['./src/components/auth/**/*.{ts,tsx}'],
};

export default config;
