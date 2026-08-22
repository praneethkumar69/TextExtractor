/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        unthinkable: {
          green: '#22c55e',
          greenHover: '#16a34a',
          greenLight: '#4ade80',
          greenBg: '#f0fdf4',
          greenBorder: '#bbf7d0',
          greenDark: '#15803d',
          purpleGlow: '#c084fc',
          purpleLight: '#f3e8ff',
          bg: '#fafdfa',
        }
      },
      boxShadow: {
        'unthinkable-glow': '0 10px 40px -10px rgba(34, 197, 94, 0.25), 0 0 20px 0 rgba(192, 132, 252, 0.15)',
        'pill-shadow': '0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(192, 132, 252, 0.35)',
        'card-soft': '0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(226, 232, 240, 0.8)',
      },
      backgroundImage: {
        'grid-pattern': 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.35s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards'
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.015)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
}
