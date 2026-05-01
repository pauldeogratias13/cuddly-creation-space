#!/usr/bin/env node
// Pins Gradle wrapper to 8.6, which is compatible with react-native 0.74.x
// Runs as a postinstall script after expo prebuild generates the android folder

const fs = require('fs');
const path = require('path');

const wrapperPath = path.join(__dirname, '..', 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');

if (!fs.existsSync(wrapperPath)) {
  console.log('⏭  No gradle-wrapper.properties found, skipping (prebuild not yet run)');
  process.exit(0);
}

let content = fs.readFileSync(wrapperPath, 'utf8');
const updated = content.replace(
  /distributionUrl=.*gradle-.*\.zip/,
  'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.6-all.zip'
);

if (updated === content) {
  console.log('ℹ️  Gradle wrapper already at correct version, no changes needed');
} else {
  fs.writeFileSync(wrapperPath, updated);
  console.log('✅ Pinned Gradle wrapper to 8.6');
}
