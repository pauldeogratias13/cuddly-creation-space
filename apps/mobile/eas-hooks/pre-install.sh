#!/bin/bash
# Pins Gradle wrapper to 8.6 which is compatible with react-native 0.74.x
GRADLE_WRAPPER="android/gradle/wrapper/gradle-wrapper.properties"
if [ -f "$GRADLE_WRAPPER" ]; then
  sed -i 's|gradle-[0-9]*\.[0-9]*\.[0-9]*-all|gradle-8.6-all|g' "$GRADLE_WRAPPER"
  echo "✅ Pinned Gradle wrapper to 8.6"
else
  echo "⚠️  gradle-wrapper.properties not found, skipping"
fi
