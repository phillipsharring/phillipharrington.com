/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './content/**/*.html',
    './components/**/*.ejs',
    './layouts/**/*.ejs',
    './assets/templates/**/*.ejs',
    './assets/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        atlantis: {
          50: '#f5faeb',
          100: '#e7f4d3',
          200: '#d2ebab',
          300: '#b3dc7a',
          400: '#8dc640',
          500: '#78b032',
          600: '#5c8c24',
          700: '#476b20',
          800: '#3a561e',
          900: '#33491e',
          950: '#19280b',
        },
        'deep-cove': {
          50: '#ecf3ff',
          100: '#dce8ff',
          200: '#c0d3ff',
          300: '#9ab6ff',
          400: '#728cff',
          500: '#5164ff',
          600: '#3238f9',
          700: '#2629dc',
          800: '#2226b1',
          900: '#242a8b',
          950: '#0f103a',
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.mbs-0': {
          'margin-block-start': '0 !important',
        },
        // add other spacing values if needed
      };

      addUtilities(newUtilities, ['responsive', 'hover']);
    },
  ],
};
