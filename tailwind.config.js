/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        slideRight: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '50%': { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0)', transformOrigin: 'right' }
        }
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        slideRight: 'slideRight 1.5s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}