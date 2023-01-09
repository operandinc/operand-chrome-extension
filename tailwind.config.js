module.exports = {
  content: ['./src/**/**/*.{html,js,tsx,jsx,ts}'],
  theme: {
    extend: {},
  },
  variants: {},
  corePlugins: {
    preflight: false,
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
  ],
  daisyui: {
    themes: ['lofi', 'black'],
    darkMode: 'black',
  },
};
