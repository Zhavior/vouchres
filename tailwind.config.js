/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Premium cyber blue dark mode palette
        navy: {
          950: "#050810",
          900: "#0A0E1A",
          850: "#0F1424",
          800: "#141A2E",
          700: "#1B2240",
          600: "#232D55",
        },
        electric: {
          50: "#E6FBFF",
          100: "#B3F3FF",
          200: "#80EBFF",
          300: "#4DE3FF",
          400: "#1ADBFF",
          500: "#00D4FF",
          600: "#00A8CC",
          700: "#007D99",
          800: "#005266",
          900: "#002933",
        },
        success: "#3DD68C",
        warning: "#FFB020",
        danger: "#FF4D6D",
        glass: "rgba(20, 26, 46, 0.6)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(0, 212, 255, 0.25)",
        "glow-strong": "0 0 40px rgba(0, 212, 255, 0.45)",
        "glow-success": "0 0 24px rgba(61, 214, 140, 0.35)",
        "glow-danger": "0 0 24px rgba(255, 77, 109, 0.35)",
      },
      backgroundImage: {
        "navy-gradient": "linear-gradient(180deg, #050810 0%, #0A0E1A 100%)",
        "electric-gradient": "linear-gradient(135deg, #00D4FF 0%, #007D99 100%)",
        "zigzag-light": "repeating-linear-gradient(135deg, transparent 0 12px, rgba(0, 212, 255, 0.03) 12px 13px)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "slide-up": "slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.2)" },
          "50%": { boxShadow: "0 0 36px rgba(0, 212, 255, 0.5)" },
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
