#!/usr/bin/env bash
# EAS Build hook: runs AFTER expo prebuild generates the android/ directory
# File must be named eas-build-post-install.sh at apps/mobile root
set -e

echo "🔧 [EAS Hook] Pinning Gradle wrapper to 8.6 (required for RN 0.74.x)..."

GRADLE_WRAPPER="android/gradle/wrapper/gradle-wrapper.properties"

if [ ! -f "$GRADLE_WRAPPER" ]; then
  echo "⚠️  gradle-wrapper.properties not found — prebuild may not have run. Skipping."
  exit 0
fi

# Replace whatever distributionUrl EAS prebuild generated with 8.6
sed -i 's|distributionUrl=.*|distributionUrl=https\\://services.gradle.org/distributions/gradle-8.6-all.zip|' "$GRADLE_WRAPPER"

echo "✅ Gradle pinned to 8.6"
echo "--- gradle-wrapper.properties ---"
cat "$GRADLE_WRAPPER"
