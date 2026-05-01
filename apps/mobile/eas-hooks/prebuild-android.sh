#!/usr/bin/env bash
# Called by eas.json prebuildCommand for the production profile.
set -euo pipefail

echo "▶️  Running expo prebuild for Android..."
bun expo prebuild --platform android

WRAPPER="android/gradle/wrapper/gradle-wrapper.properties"

echo "▶️  Patching Gradle wrapper → 8.8 (compatible with RN 0.76, avoids serviceOf removed in 8.9+)..."
perl -i -pe 's|distributionUrl=.*|distributionUrl=https\://services.gradle.org/distributions/gradle-8.8-all.zip|' "$WRAPPER"

echo "✅ Done. Current gradle-wrapper.properties:"
cat "$WRAPPER"
