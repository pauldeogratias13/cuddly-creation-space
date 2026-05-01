#!/usr/bin/env node
// Pins Gradle wrapper to 8.6, compatible with react-native 0.74.x
// Runs as postinstall - EAS runs pnpm install after prebuild generates android/

const fs = require('fs');
const path = require('path');

// When run as postinstall, cwd is apps/mobile
// When run from eas-hooks/, go up one level
const projectRoot = path.resolve(__dirname, '..');
const wrapperPath = path.join(projectRoot, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');

if (!fs.existsSync(wrapperPath)) {
  console.log('⏭  No gradle-wrapper.properties found, skipping (prebuild not yet run)');
  process.exit(0);
}

let content = fs.readFileSync(wrapperPath, 'utf8');
const patched = content.replace(
  /distributionUrl=.*/,
  'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.6-all.zip'
);

if (patched === content) {
  console.log('ℹ️  Gradle wrapper already correct, no changes needed');
} else {
  fs.writeFileSync(wrapperPath, patched);
  console.log('✅ Gradle wrapper pinned to 8.6');
}
