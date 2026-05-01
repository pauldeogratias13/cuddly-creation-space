#!/bin/bash
set -e

echo "📦 Patching gradle-wrapper.properties to use Gradle 8.6 (compatible with RN 0.74)..."

GRADLE_WRAPPER="android/gradle/wrapper/gradle-wrapper.properties"

# Write the gradle wrapper properties directly with the correct version
mkdir -p android/gradle/wrapper
cat > "$GRADLE_WRAPPER" << 'EOF'
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.6-all.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

echo "✅ Gradle wrapper pinned to 8.6"
