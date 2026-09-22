import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  test: {
    env: {
      NODE_ENV: "test",
      YOUTUBE_API_KEY: "",
      OPENAI_API_KEY: "",
      FIRECRAWL_API_KEY: "",
      AGENTMAIL_API_KEY: "",
      SARVAM_API_KEY: "",
    },
    projects: [
      {
        plugins: [react(), tsconfigPaths()],
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          setupFiles: ["./src/test/setup.tsx"],
        },
      },
      {
        test: {
          name: "convex",
          environment: "edge-runtime",
          include: ["convex/**/*.test.ts"],
          setupFiles: ["./src/test/convexSetup.ts"],
        },
      },
    ],
  },
});
