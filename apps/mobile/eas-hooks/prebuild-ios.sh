#!/bin/bash
set -e

echo "🔧 Running expo prebuild for iOS simulator..."
npx expo prebuild --clean --platform ios

echo "✅ iOS prebuild complete"
