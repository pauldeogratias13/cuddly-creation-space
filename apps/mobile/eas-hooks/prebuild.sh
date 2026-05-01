#!/bin/bash
set -e

echo "📦 Patching Gradle wrapper to 8.6 (compatible with RN 0.74)..."
GRADLE_WRAPPER="android/gradle/wrapper/gradle-wrapper.properties"

if [ -f "$GRADLE_WRAPPER" ]; then
  sed -i 's|distributionUrl=.*|distributionUrl=https\\://services.gradle.org/distributions/gradle-8.6-all.zip|g' "$GRADLE_WRAPPER"
  echo "✅ Gradle pinned to 8.6"
  cat "$GRADLE_WRAPPER"
else
  echo "❌ gradle-wrapper.properties not found - prebuild may not have run yet"
  exit 1
fi
