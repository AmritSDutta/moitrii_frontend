import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        petal: {
          50: "#FAF4F0",
          100: "#F4E9E3",
          200: "#E8D8D0",
          300: "#DBC6BC",
          400: "#C9ABA0",
          500: "#B85D6E",
        },
        forest: {
          50: "#EDF5F1",
          100: "#D6E9E0",
          500: "#2D7051",
          700: "#22533C",
          800: "#1C4732",
          900: "#143525",
        },
        charcoal: {
          500: "#705B63",
          700: "#3D2D33",
          800: "#2C1E23",
          900: "#1E1619",
        },
        terracotta: {
          DEFAULT: "#C86D51",
          light: "#E38A6E",
          dark: "#A34D33",
        },
        rosebrand: {
          DEFAULT: "#B85D6E",
          light: "#D87F90",
          soft: "#F8E8EC",
          dark: "#8F3E4E",
        },
        goldbrand: {
          DEFAULT: "#C29253",
          light: "#DEAF72",
        },
        cream: {
          50: "#FDFBF7",
          100: "#FAF7F2",
          200: "#F4EFEA",
        }
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "Cambria", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        editorial: "0 10px 30px -5px rgba(44, 30, 35, 0.07), 0 4px 10px -3px rgba(44, 30, 35, 0.04)",
        card: "0 4px 20px -2px rgba(44, 30, 35, 0.05)",
      }
    },
  },
  plugins: [],
};

export default config;
