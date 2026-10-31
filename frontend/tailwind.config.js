/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F7F7F4",
        ink: "#1B1E20",
        inkmute: "#5B6266",
        line: "#DEDDD6",
        slate: {
          DEFAULT: "#20535C",
          dark: "#153B42",
          light: "#EAF1F1",
        },
        amber: {
          DEFAULT: "#E2932F",
          light: "#FBEEDB",
        },
        diff: {
          add: "#2E7D4F",
          addBg: "#E9F5EC",
          del: "#C1443C",
          delBg: "#FBEAE8",
          warn: "#B8862B",
          warnBg: "#FBF1DE",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
