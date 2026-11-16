/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ao3: {
          red: "#990000",
          redDark: "#700000",
          border: "#dddddd",
          bg: "#ffffff",
          sidebar: "#eeeeee",
          shipBg: "#f2f2f2",
          text: "#2a2a2a",
          muted: "#555555",
          link: "#111111",
          bannerBg: "#f9e398",
          bannerBorder: "#e4be44",
        },
      },
      fontFamily: {
        ao3Sans: ['"Lucida Grande"', '"Lucida Sans Unicode"', '"GNU Unifont"', 'Verdana', 'Helvetica', 'sans-serif'],
        ao3Serif: ['Georgia', '"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [],
};
