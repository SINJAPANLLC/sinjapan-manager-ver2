/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b9dfff',
          300: '#7cc4ff',
          400: '#36a6ff',
          500: '#0c8fff',
          600: '#0070f3',
          700: '#0058d4',
          800: '#0049ab',
          900: '#003d8a',
        },
        accent: {
          blue: '#0070f3',
          cyan: '#00b4d8',
          indigo: '#4f46e5',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #0070f3 0%, #00b4d8 100%)',
        'gradient-primary-subtle': 'linear-gradient(135deg, #e0efff 0%, #f0f7ff 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0070f3 0%, #4f46e5 50%, #00b4d8 100%)',
        'gradient-card': 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #0070f3 0%, #0058d4 100%)',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 0 0 1px rgba(0, 112, 243, 0.05), 0 2px 20px -2px rgba(0, 112, 243, 0.1)',
        'card-hover': '0 0 0 1px rgba(0, 112, 243, 0.1), 0 10px 40px -10px rgba(0, 112, 243, 0.2)',
        'button': '0 4px 14px 0 rgba(0, 112, 243, 0.39)',
        'glow': '0 0 40px rgba(0, 112, 243, 0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
