import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    // Turbopack always uses LightningCSS; this tunes feature transpilation.
    // Keep PostCSS (@tailwindcss/postcss) — useLightningcss would disable it on webpack.
    lightningCssFeatures: {
      exclude: ["light-dark"],
    },
  },
};

export default nextConfig;
