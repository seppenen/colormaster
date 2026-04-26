/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        stripe: {
          blue: '#635bff',
          dark: '#0a2540',
          slate: '#425466',
          light: '#f6f9fc',
          purple: '#7a73ff',
        },
      },
      boxShadow: {
        stripe: '0 7px 14px 0 rgba(60, 66, 87, 0.08), 0 3px 6px 0 rgba(0, 0, 0, 0.12)',
        'stripe-sm': '0 2px 5px 0 rgba(60, 66, 87, 0.08), 0 1px 1px 0 rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        stripe: '4px',
      },
    },
  },
  plugins: [],
};
