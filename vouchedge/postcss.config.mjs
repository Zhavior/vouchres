/**
 * Tailwind v4 PostCSS entry. @tailwindcss/postcss compiles via @tailwindcss/node,
 * which uses LightningCSS internally for transforms and vendor prefixing.
 * Next.js Turbopack also uses LightningCSS for bundling; webpack uses PostCSS here.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
