import { config as loadDotenv } from "dotenv";
import { defineConfig } from "vitest/config";

// Tests run against a separate database (TEST_DATABASE_URL), never the dev DB.
loadDotenv({ quiet: true });
const testEnv = {
  APP_ENV: "test",
  DATABASE_URL:
    process.env.TEST_DATABASE_URL ??
    "postgres://foreningsplatform:foreningsplatform@localhost:5432/foreningsplatform_test",
  BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-0123",
  BETTER_AUTH_URL: "http://localhost:3000",
  EMAIL_TRANSPORT: "log",
  LOG_LEVEL: "warn",
};
// Set for the global setup (main process) as well as the test workers.
Object.assign(process.env, testEnv);

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // `server-only` throws outside the React Server environment; it is a no-op here.
    alias: { "server-only": new URL("./tests/support/empty-module.ts", import.meta.url).pathname },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/integration/**/*.test.ts"],
    globalSetup: ["./tests/support/global-setup.ts"],
    // Integration tests share one database, so files run one at a time.
    fileParallelism: false,
    env: testEnv,
  },
});
