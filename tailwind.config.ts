import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Emerald dark theme tokens
        bg: "#0b0f0d",
        surface: "#101512",
        "surface-2": "#151916",
        border: "#1d2722",
        muted: "#7e8a82",
        "muted-2": "#5e7a68",
        text: "#e8efe9",
        accent: "#22c55e",
        "accent-soft": "#34d77f",
        income: "#34d77f",
        expense: "#e08a4a",
        neutral: "#3fc5d8",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
