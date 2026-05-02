import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteTsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tanstackRouter(), viteTsconfigPaths(), tailwindcss()],
  server: {
    port: 3000,
    host: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@nexus/shared": path.resolve(__dirname, "../../packages/shared/src"),
      // Use lightweight shim instead of full react-native-web to avoid
      // Flow-typed transitive deps (@react-native/assets-registry) that
      // esbuild cannot parse.
      "react-native": path.resolve(__dirname, "./src/shims/react-native.ts"),
      // Regex aliases catch subpath imports like @react-native/assets-registry/registry
      "@react-native/assets-registry/registry": path.resolve(
        __dirname,
        "./src/shims/assets-registry-registry.ts"
      ),
      "@react-native/assets-registry": path.resolve(
        __dirname,
        "./src/shims/assets-registry.ts"
      ),
    },
  },
});
