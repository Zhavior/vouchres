import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

/** Modern evergreen targets for LightningCSS vendor prefixing. */
const LIGHTNINGCSS_TARGETS = {
  chrome: 105 << 16,
  edge: 105 << 16,
  firefox: 104 << 16,
  safari: (16 << 16) | 0,
  ios_saf: (16 << 16) | 0,
} as const;

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
    css: {
      transformer: 'lightningcss',
      lightningcss: {
        targets: LIGHTNINGCSS_TARGETS,
      },
    },
    optimizeDeps: {
      include: ['@supabase/supabase-js'],
    },
    build: {
      cssMinify: 'lightningcss',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            const isPkg = (pkg: string) =>
              id.includes(`/node_modules/${pkg}/`) ||
              id.includes(`\\node_modules\\${pkg}\\`);

            // State + query cache — before react check (@tanstack/react-query contains "/react/")
            if (
              id.includes('@tanstack/react-query') ||
              isPkg('zustand') ||
              isPkg('zod')
            ) {
              return 'vendor-state';
            }

            // Core React runtime — exact package paths only
            if (isPkg('react') || isPkg('react-dom') || isPkg('scheduler')) {
              return 'vendor-react';
            }

            if (id.includes('@supabase/')) return 'vendor-supabase';

            if (
              id.includes('/recharts/') ||
              id.includes('/d3-') ||
              id.includes('victory-')
            ) {
              return 'vendor-charts';
            }

            if (isPkg('framer-motion') || isPkg('motion')) {
              return 'vendor-motion';
            }

            if (id.includes('lucide-react')) return 'vendor-icons';

            if (id.includes('stripe')) return 'vendor-stripe';

            if (id.includes('cytoscape') || id.includes('mermaid')) {
              return 'vendor-graph';
            }

            if (id.includes('@tanstack/react-virtual')) return 'vendor-virtual';
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
              '**/tests/**',
              '**/*.test.ts',
              '**/*.test.tsx',
              '**/*.spec.ts',
              '**/*.spec.tsx',
              '**/*.backup*.ts',
              '**/*.backup*.tsx',
              '**/*.save',
              '**/*.zip',
            ],
          },
    },
  };
});
