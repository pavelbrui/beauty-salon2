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
          DEFAULT: '#C9A227',
          50: '#FDF9E7',
          100: '#F9F0C3',
          200: '#F2E08C',
          300: '#E8CC4D',
          400: '#DDB82E',
          500: '#C9A227',
          600: '#A8841F',
          700: '#8B6B1A',
          800: '#735619',
          900: '#614A18',
        },
        dark: {
          DEFAULT: '#0a0a0a',
          50: '#1a1a1a',
          100: '#141414',
          200: '#0f0f0f',
          300: '#0a0a0a',
        },
        cream: {
          DEFAULT: '#F5F0E6',
          50: '#FDFCF9',
          100: '#F9F6F0',
          200: '#F5F0E6',
          300: '#E8E2D6',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
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
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        slideRight: 'slideRight 1.5s ease-in-out infinite',
        fadeIn: 'fadeIn 0.5s ease-out forwards',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #C9A227 0%, #E8CC4D 50%, #C9A227 100%)',
      },
    },
  },
  plugins: [],
}
