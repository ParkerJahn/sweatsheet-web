/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'ethnocentric': ['Ethnocentric Rg', 'sans-serif'],
      },
    },
  },
  plugins: [
  ],
}

