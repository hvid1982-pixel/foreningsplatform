/**
 * Structured JSON logger (pino). Use child loggers with a `module` field:
 *   const log = logger.child({ module: "campaigns" });
 * Never log secrets, passwords or personal data beyond what is necessary.
 */
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { app: "foreningsplatform", env: process.env.APP_ENV ?? "development" },
  redact: {
    paths: ["password", "*.password", "token", "*.token", "headers.cookie", "headers.authorization"],
    censor: "[skjult]",
  },
});
