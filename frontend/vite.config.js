import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build straight into the FastAPI static dir. index.html + /assets/* are then
// served by the API (GET / and a StaticFiles mount at /assets).
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "../src/insightledger/api/static",
    assetsDir: "assets",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
  },
  server: {
    proxy: {
      "/query": "http://127.0.0.1:8000",
      "/ingest": "http://127.0.0.1:8000",
      "/documents": "http://127.0.0.1:8000",
      "/tickers": "http://127.0.0.1:8000",
      "/health": "http://127.0.0.1:8000",
      "/trace": "http://127.0.0.1:8000",
    },
  },
});
