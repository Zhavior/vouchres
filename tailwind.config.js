/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Map old color names to CSS variables for theme compatibility
        navy: {
          950: "var(--ve-bg)",
          900: "var(--ve-bg)",
          850: "var(--ve-card-bg)",
          800: "var(--ve-card-bg)",
          700: "var(--ve-card-border)",
          600: "var(--ve-card-border)",
        },
        electric: {
          50: "var(--ve-bg)",
          100: "var(--ve-badge-bg)",
          200: "var(--ve-neon)",
          300: "var(--ve-accent)",
          400: "var(--ve-accent)",
          500: "var(--ve-accent)",
          600: "var(--ve-accent-2)",
          700: "var(--ve-accent-2)",
          800: "var(--ve-accent-2)",
          900: "var(--ve-accent-2)",
        },
        success: "var(--ve-success)",
        warning: "var(--ve-warning)",
        danger: "var(--ve-danger)",
        glass: "var(--ve-card-bg)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px var(--ve-accent)",
        "glow-strong": "0 0 40px var(--ve-accent)",
        "glow-success": "0 0 24px var(--ve-success)",
        "glow-danger": "0 0 24px var(--ve-danger)",
      },
      backgroundImage: {
        "navy-gradient": "var(--ve-bg-gradient)",
        "electric-gradient": "var(--ve-button-bg)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "slide-up": "slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px var(--ve-accent)" },
          "50%": { boxShadow: "0 0 36px var(--ve-accent)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
