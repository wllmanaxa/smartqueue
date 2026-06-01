/** @type {import('tailwindcss').Config} */

export default {

  content: ['./index.html', './src/**/*.{js,jsx}'],

  darkMode: 'class',

  theme: {

    extend: {

      fontFamily: {

        sans: ['Inter', 'system-ui', 'sans-serif'],

      },

      colors: {

        primary: {

          50: '#eff6ff',

          100: '#dbeafe',

          200: '#bfdbfe',

          300: '#93c5fd',

          400: '#60a5fa',

          500: '#3b82f6',

          600: '#2563eb',

          700: '#1d4ed8',

          800: '#1e40af',

          900: '#1e3a8a',

        },

      },

      boxShadow: {

        soft: '0 4px 24px -4px rgba(15, 23, 42, 0.08)',

        card: '0 8px 30px -12px rgba(37, 99, 235, 0.12)',

        elevated: '0 12px 40px -16px rgba(15, 23, 42, 0.12)',

        sidebar: '4px 0 24px -8px rgba(0, 0, 0, 0.25)',

        glass: '0 8px 32px rgba(15, 23, 42, 0.08)',

        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.35)',

        glow: '0 0 40px -8px rgba(99, 102, 241, 0.45)',

      },

      animation: {

        'fade-in': 'fadeIn 0.4s ease-out',

        shimmer: 'shimmer 2s linear infinite',

      },

      keyframes: {

        fadeIn: {

          '0%': { opacity: '0', transform: 'translateY(8px)' },

          '100%': { opacity: '1', transform: 'translateY(0)' },

        },

        shimmer: {

          '0%': { backgroundPosition: '-200% 0' },

          '100%': { backgroundPosition: '200% 0' },

        },

      },

    },

  },

  plugins: [],

};

