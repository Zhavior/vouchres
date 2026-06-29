import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const disableHmr = process.env.DISABLE_HMR === 'true';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['@supabase/supabase-js'],
    },
    server: {
      hmr: !disableHmr,
      proxy: {
        '/api/mlb/hr-board': {
          target: 'https://vouchres.vercel.app',
          changeOrigin: true,
          secure: true,
        },
      },
      watch: disableHmr
        ? null
        : {
            ignored: [
              '**/_code_backups/**',
              '**/_gemini_upload/**',
              '**/_gemini_clean_upload/**',
              '**/_vouchres_under_500mb/**',
              '**/*.before*.ts',
              '**/*.before*.tsx',
              '**/*.backup*.ts',
              '**/*.backup*.tsx',
              '**/*.save',
              '**/*.zip',
            ],
          },
    },
  };
});
