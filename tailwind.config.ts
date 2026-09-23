import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "#0B0B0B", foreground: "#FFFFFF" },
        accent: { DEFAULT: "#D4AF37", foreground: "#0B0B0B" },
        muted: { DEFAULT: "#F7F4EF", foreground: "#5F5750" },
        brand: {
          red: "#DD0000",
          gold: "#FFCE00",
          black: "#0B0B0B",
        },
        destructive: { DEFAULT: "#B42318", foreground: "#FFFFFF" },
      },
      borderRadius: { lg: "8px", md: "6px", sm: "4px" },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        cairo: ["var(--font-cairo)", "Cairo", "sans-serif"],
      },
    },
  },
  plugins: [animate],
};

export default config;
