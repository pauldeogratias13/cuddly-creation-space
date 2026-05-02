cd C:\Users\LENOVO\Nexus\cuddly-creation-space
pnpm install

cd apps\mobile
npx expo prebuild --platform android --clean



https://expo.dev/accounts/chrisjr/settings/access-tokens


C:\Users\LENOVO\Nexus\cuddly-creation-space\apps\mobile

Option 1 (Recommended): Use EAS Local/Cloud Build APK

Your package.json already has:

"build:android": "eas build --platform android --profile production --non-interactive"

Run:

pnpm run build:android

or

npm run build:android
Result


Option 2: True Local APK Build with Android Studio / Gradle

If you want APK generated on your PC (not EAS):

Requirements

Install:

Android Studio
Android SDK
Java 17

Then run:

npx expo prebuild --platform android

Then:

cd android
gradlew assembleDebug

(Windows)

or

./gradlew assembleDebug

(Mac/Linux)

APK Output:
android/app/build/outputs/apk/debug/app-debug.apk
Option 3: Direct Command from Your Existing Script

You already have:

"android": "expo run:android"

Run:

pnpm run android

This builds + installs to connected emulator/device.

But requires Android Studio emulator/device setup.

Best For You (Windows + Fastest)
If You Have No Android Studio Yet

Use:

pnpm run build:android

(Uses EAS)

If You Want Offline Local APK Forever

Install Android Studio and use Gradle.

Since You Asked APK Specifically

Use this after Android Studio setup:

cd C:\Users\LENOVO\Nexus\cuddly-creation-space\apps\mobile
npx expo prebuild --platform android
cd android
gradlew assembleDebug
Important Because You Use Expo SDK 52

Your native folders may regenerate. If android/ already exists, you can often run:

cd android
gradlew assembleDebug

directly.

My Honest Recommendation for You

Because you dislike limits:

Install Android Studio once, then unlimited local APK builds.

No EAS credits.



pnpm dev

cd apps/mobile
npx expo run:android