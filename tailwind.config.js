/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './content/**/*.html',
    './components/**/*.html',
    './assets/templates/**/*.html',
    './assets/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          DEFAULT: '#86cb92',
          100: '#e7f5e9',
          200: '#ceead3',
          300: '#b6e0bd',
          400: '#9ed5a7',
          500: '#86cb92',
          600: '#56b767',
          700: '#3d8d4a',
          800: '#285e31',
          900: '#142f19',
        },
        mint: {
          DEFAULT: '#71b48d',
          100: '#e2f0e8',
          200: '#c6e1d1',
          300: '#a9d2ba',
          400: '#8cc2a3',
          500: '#71b48d',
          600: '#50986e',
          700: '#3c7253',
          800: '#284c37',
          900: '#14261c',
        },
        'yinmn-blue': {
          DEFAULT: '#404e7c',
          100: '#d5d9e9',
          200: '#aab4d3',
          300: '#808ebd',
          400: '#5669a7',
          500: '#404e7c',
          600: '#333f64',
          700: '#262f4b',
          800: '#1a1f32',
          900: '#0d1019',
        },
        'space-cadet': {
          DEFAULT: '#251f47',
          100: '#cbc6e6',
          200: '#978ecd',
          300: '#6355b4',
          400: '#433880',
          500: '#251f47',
          600: '#1e1939',
          700: '#16132b',
          800: '#0f0c1c',
          900: '#07060e',
        },
        'dark-purple': {
          DEFAULT: '#260f26',
          100: '#e5bde5',
          200: '#cb7ccb',
          300: '#a843a8',
          400: '#662966',
          500: '#260f26',
          600: '#1d0c1d',
          700: '#160916',
          800: '#0f060f',
          900: '#070307',
        },
        'spring-bud': {
          50: '#d9eacb',
          100: '#b2d68e',
          200: '#8ac23f',
          300: '#78a836',
          400: '#658e2e',
          500: '#547526',
          600: '#425d1e',
          700: '#324617',
          800: '#233110',
          900: '#141c09',
        },
        'emerald-green': {
          50: '#d0ecd3',
          100: '#9bdaa2',
          200: '#53c966',
          300: '#39af4e',
          400: '#309542',
          500: '#287b37',
          600: '#20622b',
          700: '#184a21',
          800: '#113317',
          900: '#0a1e0d',
        },
        opal: {
          50: '#ccebe8',
          100: '#92d8d1',
          200: '#40c5bb',
          300: '#37aaa2',
          400: '#2f9089',
          500: '#267771',
          600: '#1f5f5a',
          700: '#174844',
          800: '#10322f',
          900: '#091c1b',
        },
        'cobalt-blue': {
          50: '#e0e4f2',
          100: '#c2cae7',
          200: '#a4b1dd',
          300: '#8498d4',
          400: '#6280cc',
          500: '#3e68c1',
          600: '#32539a',
          700: '#253f74',
          800: '#1a2b50',
          900: '#0f192f',
        },
        'blue-violet': {
          50: '#e7e2f3',
          100: '#d1c6e8',
          200: '#bbaadf',
          300: '#a78dd6',
          400: '#9370cf',
          500: '#8151c9',
          600: '#6b39b0',
          700: '#512b85',
          800: '#381e5c',
          900: '#211136',
        },
        orchid: {
          50: '#f2dfed',
          100: '#e6c0dd',
          200: '#dc9fce',
          300: '#d27dc0',
          400: '#c956b3',
          500: '#b2399c',
          600: '#8e2e7d',
          700: '#6c235f',
          800: '#4b1842',
          900: '#2c0e27',
        },
        amaranth: {
          50: '#f2e0e1',
          100: '#e7c2c4',
          200: '#dda4a6',
          300: '#d48488',
          400: '#cc6168',
          500: '#be3d47',
          600: '#983139',
          700: '#73252b',
          800: '#501a1e',
          900: '#2f0f12',
        },
        gamboge: {
          50: '#eee3d5',
          100: '#dec8a8',
          200: '#d0ad74',
          300: '#be933d',
          400: '#a17d34',
          500: '#84672b',
          600: '#695222',
          700: '#4f3e1a',
          800: '#372b12',
          900: '#20190a',
        },
        conifer: {
          50: '#f6fde8',
          100: '#e9facd',
          200: '#d4f6a0',
          300: '#b7ed69',
          400: '#a4e34e',
          500: '#7bc61c',
          600: '#5e9e12',
          700: '#487813',
          800: '#3c5f15',
          900: '#335116',
          950: '#182d06',
        },
        korma: {
          50: '#fffde6',
          100: '#fffabe',
          200: '#fff27f',
          300: '#ffe136',
          400: '#ffcd00',
          500: '#ffb200',
          600: '#dc8600',
          700: '#af5d00',
          800: '#8c4503',
          900: '#7a3a09',
          950: '#481c00',
        },
        downriver: {
          50: '#eff3ff',
          100: '#dbe3fe',
          200: '#bfcdfe',
          300: '#93abfd',
          400: '#6083fa',
          500: '#3b66f6',
          600: '#2552eb',
          700: '#1d48d8',
          800: '#1e3faf',
          900: '#1e378a',
          950: '#172554',
        },
        'mine-shaft': {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
          950: '#303030',
        },
      },
    },
  },
  plugins: [],
};