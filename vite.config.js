import { defineConfig } from "vite";

export default defineConfig({
  base: "/Amy6Tina-Handbook/",
  publicDir: "public",
  build: {
    outDir: "docs",
    emptyOutDir: true,
    sourcemap: false,
  },
});
