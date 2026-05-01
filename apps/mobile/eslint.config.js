// @ts-check
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    ignores: ['node_modules/', 'dist/', '.expo/', 'android/', 'ios/', 'eas-hooks/'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
]);
