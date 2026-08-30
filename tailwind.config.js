/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        averra: {
          green: {
            DEFAULT: '#00B894',
            dark: '#00D9A6',
            hover: '#00A381',
          }
        }
      }
    },
  },
  plugins: [],
}

