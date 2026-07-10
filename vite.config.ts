import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'path';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { LIGHTNINGCSS_TARGETS } from './css/lightningcss-targets.mjs';

function resolveBuildId(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 12);
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return `dev-${Date.now()}`;
  }
}

function buildIdPlugin(buildId: string): Plugin {
  return {
    name: 'vouchedge-build-id',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        `    <meta name="vouchedge-build-id" content="${buildId}" />\n  </head>`,
      );
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/build-id.txt' || req.url?.startsWith('/build-id.txt?')) {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(`${buildId}\n`);
          return;
        }
        next();
      });
    },
    closeBundle() {
      writeFileSync(join(process.cwd(), 'dist', 'build-id.txt'), `${buildId}\n`, 'utf8');
    },
  };
}

export default defineConfig(({ mode }) => {
  const disableHmr = process.env.DISABLE_HMR === 'true';
  const analyze = mode === 'analyze';
  const buildId = resolveBuildId();

  return {
    define: {
      __APP_BUILD_ID__: JSON.stringify(buildId),
    },
    plugins: [
      react(),
      tailwindcss(),
      buildIdPlugin(buildId),
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
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
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
