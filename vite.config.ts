import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { InlineConfig } from "vitest/node";

interface VitestConfigExport extends UserConfig {
  test?: InlineConfig;
}

export default defineConfig({
  plugins: [react()],
  base: "./",
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
} as VitestConfigExport);
