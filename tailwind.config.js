/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#faf3e8',
        },
        blush: {
          400: '#f9a8d4',
          500: '#f472b6',
          600: '#ec4899',
          700: '#db2777',
        },
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        slideRight: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '50%': { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0)', transformOrigin: 'right' }
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        slideRight: 'slideRight 1.5s ease-in-out infinite',
        fadeUp: 'fadeUp 0.6s ease-out forwards'
      }
    },
  },
  plugins: [],
}