/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mint: "#A8E6CF",
        pink: "#FFB7B2",
        lavender: "#B5A8D5",
        warmwhite: "#FFF5E4",
      },
    },
  },
  plugins: [],
};
