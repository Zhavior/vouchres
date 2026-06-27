import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // Pre-bundle heavy deps on startup so Vite doesn't discover them mid-session
    // and trigger a full-page reload loop (notably @supabase/supabase-js, which
    // enters the graph via the auth flow).
    optimizeDeps: {
      include: ['@supabase/supabase-js'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api/mlb/hr-board': {
          target: 'https://vouchres.vercel.app',
          changeOrigin: true,
          secure: true,
        },
      },
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
