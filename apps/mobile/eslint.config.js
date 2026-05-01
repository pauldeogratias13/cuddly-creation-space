// Mobile app uses eslint-config-expo
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  require('eslint-config-expo/flat'),
  {
    ignores: ['node_modules/', 'dist/', '.expo/', 'android/', 'ios/', 'eas-hooks/'],
  },
]);
