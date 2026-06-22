/* eslint-disable @typescript-eslint/no-require-imports */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/layouts/**/*.{js,ts,jsx,tsx}',
    './src/services/**/*.{js,ts,jsx,tsx}',
    './node_modules/@sk-web-gui/*/dist/**/*.js',
  ],
  safelist: ['text-error-surface-primary', 'text-vattjom-surface-primary', 'text-warning-surface-primary'],
  theme: {
    extend: {
      maxWidth: {
        content: 'var(--sk-spacing-max-content)',
        errand: '1400px',
      },
    },
  },
  darkMode: 'class', // or 'media' or 'class'
  presets: [require('@sk-web-gui/core').preset()],
  // plugins: [require('@tailwindcss/forms'), require('@sk-web-gui/core')],
};
