/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Maya Blue — the iconic turquoise pigment (replaces violet)
        violet: {
          50: "#F0F7FA",
          100: "#D6ECF3",
          200: "#ADD9E8",
          300: "#84C7DC",
          400: "#5BB4D1",
          500: "#3298B8",
          600: "#287C97",
          700: "#1F6076",
          800: "#164456",
          900: "#0D2A38",
          950: "#081B25",
        },
        // Terracotta — from Mayan murals and pottery (replaces purple)
        purple: {
          50: "#FDF3ED",
          100: "#FAE0CF",
          200: "#F4BD9B",
          300: "#ED9968",
          400: "#E67534",
          500: "#C45A14",
          600: "#A04A12",
          700: "#7C3A10",
          800: "#5C2B0E",
          900: "#401E0B",
          950: "#2A1307",
        },
      },
    },
  },
  plugins: [],
};
