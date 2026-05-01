// @ts-check
const { defineConfig } = require('eslint/config');
const tsParser = require('@typescript-eslint/parser');

module.exports = defineConfig([
  {
    ignores: ['node_modules/', 'dist/', '.expo/', 'android/', 'ios/', 'eas-hooks/'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]);
