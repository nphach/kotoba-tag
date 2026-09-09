import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const apiProxy = {
  target: "http://127.0.0.1:8000",
  changeOrigin: true,
} as const

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/warmup": apiProxy,
      "/definition": apiProxy,
      "/tag-word": apiProxy,
      "/health": apiProxy,
    },
  },
  test: {
    environment: "node",
  },
})
