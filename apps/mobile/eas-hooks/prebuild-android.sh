#!/usr/bin/env bash
# Called by eas.json prebuildCommand for the production profile.
# EAS executes this as a real shell script, so && chaining works here.
set -euo pipefail

echo "▶️  Running expo prebuild for Android..."
bun expo prebuild --platform android

WRAPPER="android/gradle/wrapper/gradle-wrapper.properties"

echo "▶️  Patching Gradle wrapper → 8.6 (required for RN 0.74, fixes serviceOf error in 8.8+)..."
perl -i -pe 's|distributionUrl=.*|distributionUrl=https\://services.gradle.org/distributions/gradle-8.6-all.zip|' "$WRAPPER"

echo "✅ Done. Current gradle-wrapper.properties:"
cat "$WRAPPER"
