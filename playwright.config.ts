import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests. Locally: `pnpm test:e2e` starts `pnpm dev` automatically
 * (or reuses a running server). In CI the app is built first and started with
 * `pnpm start`. Requires a migrated and seeded database.
 */
const port = Number(process.env.PORT ?? 3000);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    locale: "da-DK",
    timezoneId: "Europe/Copenhagen",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobil", use: { ...devices["Pixel 7"] }, testMatch: /smoke\.spec\.ts/ },
  ],
  webServer: {
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: `http://localhost:${port}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
