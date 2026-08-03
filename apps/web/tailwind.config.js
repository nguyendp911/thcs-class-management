/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb', // Primary
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#0f2747', // Navy
        },
        navy: {
          DEFAULT: '#0F2747',
          dark: '#0A1B33',
        },
        surface: '#FFFFFF',
        appbg: '#F8FAFC',
      },
    },
  },
  plugins: [],
}
