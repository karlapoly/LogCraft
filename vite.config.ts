import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

function toChunkName(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (normalizedId.includes("node_modules")) {
            if (normalizedId.includes("node_modules/phaser")) {
              return "phaser";
            }

            if (normalizedId.includes("node_modules/react") || normalizedId.includes("node_modules/react-dom")) {
              return "react";
            }

            if (normalizedId.includes("node_modules/zustand")) {
              return "zustand";
            }

            return "vendor";
          }

          const sceneMatch = normalizedId.match(/\/src\/game\/scenes\/([^/]+)\.ts$/);
          if (sceneMatch?.[1]) {
            return `scene-${toChunkName(sceneMatch[1])}`;
          }

          if (normalizedId.includes("/src/state/")) {
            return "game-state";
          }
        },
      },
    },
  },
  plugins: [
    react(),
    ViteImageOptimizer({
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 75,
      },
      webp: {
        lossless: true,
      },
      avif: {
        lossless: true,
      },
    }),
  ],
});
