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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase/')) return 'supabase-vendor';
            if (id.includes('/recharts/') || id.includes('/d3-')) return 'charts-vendor';
            if (id.includes('/framer-motion/') || id.includes('/motion/')) return 'motion-vendor';
            if (id.includes('@dnd-kit/')) return 'dnd-vendor';
            if (id.includes('@sentry/') || id.includes('posthog-js')) return 'telemetry-vendor';
          },
        },
      },
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
