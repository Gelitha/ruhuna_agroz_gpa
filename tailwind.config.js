/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',
        '68': '17rem',
      },
      colors: {
        background: '#F8F8F4',
        surface: '#FFFFFF',
        'surface-subtle': '#F0F3EF',
        border: '#DCDDD7',
        'border-subtle': '#EDF1EC',
        main: '#242824',
        secondary: '#626962',
        primary: {
          DEFAULT: '#176B45',
          hover: '#103B2D',
          deep: '#103B2D',
          light: '#EAF2ED',
          border: '#DCDDD7'
        },
        brand: {
          green: '#176B45',
          deep: '#103B2D',
          bg: '#F8F8F4',
          surface: '#FFFFFF',
          text: '#242824',
          muted: '#626962',
          border: '#DCDDD7',
          gold: '#B28A38'
        },
        accent: {
          success: '#176B45',
          'success-light': '#E9F5EF',
          warning: '#B28A38',
          'warning-light': '#FDF6E9',
          danger: '#C65A55',
          'danger-light': '#FDF0EF',
          info: '#2D6B82',
          'info-light': '#EBF4F7'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card': '0 1px 2px rgba(0, 0, 0, 0.03), 0 4px 12px rgba(0, 0, 0, 0.02)',
        'modal': '0 12px 32px -4px rgba(32, 41, 35, 0.12), 0 4px 12px -2px rgba(32, 41, 35, 0.06)'
      }
    },
  },
  plugins: [],
}
