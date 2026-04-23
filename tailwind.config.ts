import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f6f7",
          100: "#ebecef",
          200: "#d2d4da",
          300: "#a9adb8",
          400: "#797f8e",
          500: "#555b69",
          600: "#3d4250",
          700: "#2b2f3a",
          800: "#1a1d26",
          900: "#0d0f14",
        },
        brand: {
          DEFAULT: "#ef4444",
          fg: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Inter", "Roboto", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)",
      },
    },
  },
  plugins: [],
};

export default config;
