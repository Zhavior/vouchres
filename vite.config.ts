import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const disableHmr = process.env.DISABLE_HMR === 'true';
  const analyze = mode === 'analyze';

  return {
    plugins: [
      react(),
      tailwindcss(),
      analyze
        ? visualizer({
            filename: 'dist/bundle-report.html',
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
          })
        : null,
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['@supabase/supabase-js'],
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            // Core React runtime — smallest possible initial chunk
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'react-vendor';
            }

            // Supabase — large auth/realtime SDK
            if (id.includes('@supabase/')) return 'supabase-vendor';

            // Charts — recharts + all d3 sub-packages
            if (
              id.includes('/recharts/') ||
              id.includes('/d3-') ||
              id.includes('victory-')
            ) {
              return 'charts-vendor';
            }

            // Animation — framer-motion + motion
            if (id.includes('/framer-motion/') || id.includes('/motion/')) {
              return 'motion-vendor';
            }

            // Drag and drop
            if (id.includes('@dnd-kit/')) return 'dnd-vendor';

            // Observability — never needed on first paint
            if (
              id.includes('@sentry/') ||
              id.includes('posthog-js') ||
              id.includes('@vercel/')
            ) {
              return 'telemetry-vendor';
            }

            // Icons — lucide is large, isolate it
            if (id.includes('lucide-react')) return 'icons-vendor';

            // Stripe — only needed on billing pages
            if (id.includes('stripe')) return 'stripe-vendor';

            // State + validation
            if (id.includes('zustand') || id.includes('zod')) {
              return 'state-vendor';
            }

            // Google AI SDK
            if (id.includes('@google/genai')) return 'ai-vendor';

            // Google auth
            if (id.includes('google-auth-library')) return 'ai-vendor';
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
