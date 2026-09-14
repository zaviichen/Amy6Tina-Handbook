import { defineConfig } from "vite";

export default defineConfig({
  base: "/Amy6Tina-Handbook/",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
