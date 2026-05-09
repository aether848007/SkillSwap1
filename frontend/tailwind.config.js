/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F4E79',
          light: '#2E75B6',
          dark: '#163a5c',
        },
        accent: '#00C9A7',
      },
    },
  },
  plugins: [],
}
