// Statik (SPA) qurilma — Qoder Sites'ga chop etish uchun.
// Lovable bilan bog'langan `npm run build` (TanStack Start SSR) o'zgarmaydi;
// bu konfiguratsiya alohida: `npm run build:sites` -> dist/
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: `${projectRoot}web`,
  base: "/",
  publicDir: `${projectRoot}public`,
  resolve: {
    alias: { "@": `${projectRoot}src` },
  },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: `${projectRoot}dist`,
    emptyOutDir: true,
    sourcemap: false,
  },
});
