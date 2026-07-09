import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FAF7F2",
          soft: "#F5EFE5",
        },
        ink: {
          DEFAULT: "#2B2622",
          soft: "#6B6259",
          faint: "#9C9285",
        },
        line: {
          DEFAULT: "#E7DFD3",
          soft: "#EFE9DE",
        },
        accent: {
          DEFAULT: "#B5794A",
          soft: "#EFE3D3",
          strong: "#8F5D35",
        },
        sage: {
          DEFAULT: "#6B8F71",
          soft: "#E4EBE3",
        },
        clay: {
          DEFAULT: "#B5574A",
          soft: "#F1E1DD",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-noto-sans-kr)",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(43, 38, 34, 0.04), 0 8px 24px -12px rgba(43, 38, 34, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
