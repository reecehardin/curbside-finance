import type { Config } from "tailwindcss";

/**
 * "Midnight Chrome" — palette derived from the Curbside LA logo:
 * near-black night backdrop, electric chrome-blue primary, neon green for
 * income, hot-pink for expenses, purple as a tertiary accent.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#06070d",
        "bg-deep": "#04050a",
        surface: "#0d0f1a",
        "surface-2": "#141728",
        border: "#1f2336",
        "border-bright": "#2f3556",
        text: "#eef0fa",
        muted: "#8b90ad",
        "muted-2": "#5f6488",
        primary: "#3d8bff",
        "primary-bright": "#6ba6ff",
        cyan: "#22d3ee",
        income: "#2fe88f",
        expense: "#ff3d7f",
        purple: "#a06bff",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "0.875rem",
      },
      boxShadow: {
        "glow-blue": "0 0 24px -6px rgba(61,139,255,0.55)",
        "glow-green": "0 0 24px -6px rgba(47,232,143,0.5)",
        "glow-pink": "0 0 24px -6px rgba(255,61,127,0.5)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
