import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000/health",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      AUTH_TRUST_HOST: "1",
    },
  },
});
