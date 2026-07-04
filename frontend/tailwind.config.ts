import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0C0E",
        carbon: "#17191D",
        graphite: "#2D3036",
        paper: "#F8F7F2",
        linen: "#EEE9DC",
        nomba: {
          yellow: "#FFD200",
          gold: "#E7AF00",
          black: "#050505",
        },
        mint: {
          50: "#EAFBF3",
          100: "#CFF6E3",
          500: "#24B47E",
          700: "#087A55",
        },
      },
      boxShadow: {
        soft: "0 20px 60px rgba(11, 12, 14, 0.08)",
        line: "0 1px 0 rgba(11, 12, 14, 0.08)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
