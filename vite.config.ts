
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a function to dynamically import cartographer if needed
function getPlugins() {
  const plugins = [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
  ];
  
  // Don't use dynamic import in production
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    // Add empty placeholder that will be replaced at runtime
    plugins.push({
      name: 'cartographer-placeholder',
      async configResolved(config) {
        try {
          const cartographer = await import("@replit/vite-plugin-cartographer");
          plugins.push(cartographer.cartographer());
        } catch (err) {
          console.warn("Cartographer plugin could not be loaded:", err);
        }
      }
    });
  }
  
  return plugins;
}

export default defineConfig({
  plugins: getPlugins(),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
