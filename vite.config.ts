// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webSrc = path.resolve(__dirname, "apps/web/src");

export default defineConfig({
  vite: {
    // Point Lovable's build server at apps/web/src instead of root src/
    resolve: {
      alias: {
        "@": webSrc,
        "react-native": path.resolve(webSrc, "shims/react-native.ts"),
        "@react-native/assets-registry/registry": path.resolve(webSrc, "shims/assets-registry-registry.ts"),
        "@react-native/assets-registry": path.resolve(webSrc, "shims/assets-registry.ts"),
      },
    },
  },
  tanstackStart: {
    // Tell TanStack Start plugin where to find router, routeTree, etc.
    // This is relative to process.cwd() (the repo root on Lovable's build server)
    srcDirectory: "apps/web/src",
  },
});
