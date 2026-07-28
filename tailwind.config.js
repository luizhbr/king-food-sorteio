/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'king-green': '#166534',
        'king-green-light': '#22c55e',
        'king-gold': '#f59e0b',
        'king-gold-light': '#fbbf24'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}