# Fix Vite Dependency Resolution for Shared Native Code

The web app is failing to resolve `react-native` imports from shared packages and node_modules because the previous alias configuration was incomplete for a monorepo structure. We need to ensure that all imports of `react-native` are correctly redirected to `react-native-web` and that native-only dependencies are either shimmed or handled correctly.

## Proposed Changes

### Web Application

#### [vite.config.ts](file:///C:/Users/LENOVO/Nexus/cuddly-creation-space/apps/web/vite.config.ts)

- Expand `resolve.alias` to cover more potential native-only imports.
- Use `optimizeDeps.include` to ensure `react-native-web` is pre-bundled if necessary, but keep it excluded from optimization if it causes issues with aliasing.
- Ensure the alias works for packages outside the `apps/web` directory (like `packages/shared`).

#### [package.json](file:///C:/Users/LENOVO/Nexus/cuddly-creation-space/apps/web/package.json)

- Ensure all necessary web shims for Expo are present.

## Verification Plan

### Manual Verification
- Run `pnpm dev` in the root and check the browser console and terminal for resolution errors.
- Navigate through the web app to ensure shared hooks (which use `react-native`'s `Platform`) work correctly.
