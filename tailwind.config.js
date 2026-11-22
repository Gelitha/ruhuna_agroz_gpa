/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',
        '68': '17rem',
      },
      colors: {
        background: '#F7F8F5',
        surface: '#FFFFFF',
        'surface-subtle': '#F0F3EF',
        border: '#E6EAE5',
        'border-subtle': '#EDF1EC',
        main: '#202923',
        secondary: '#78827A',
        primary: {
          DEFAULT: '#245C45',
          hover: '#194A36',
          light: '#EAF2ED',
          border: '#D0DEC9'
        },
        accent: {
          success: '#27845B',
          'success-light': '#E9F5EF',
          warning: '#C58A35',
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

