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
    themes: [
      {
        operand: {
          'color-scheme': 'light',
          primary: '#171717',
          secondary: '#444444',
          accent: '#59c3e5',
          neutral: '#f5f5f4',
          'base-100': '#ffffff',
          info: '#155e75',
          success: '#16a34a',
          warning: '#fbbf24',
          error: '#dc2626',
          '--rounded-box': '0.5rem',
          '--rounded-btn': '0.5rem',
          '--rounded-badge': '0.5rem',
          '--animation-btn': '0',
          '--animation-input': '0',
          '--btn-focus-scale': '1',
          '--tab-radius': '0',
          '.card': {
            'border-color': '#171717',
          },
          '.input:focus': {
            // focus outline should be transparent
            outline: '2px solid transparent',
            active: '2px solid transparent',
          },
          '.table': {
            'tr.active, tr.active:nth-child(even)': {
              'th, td': {
                'background-color': '#59c3e5',
              },
            },
          },
        },
      },
    ],
  },
};
