import type { NextConfig } from "next";

/**
 * Next.js configuration.
 *
 * Cache Components and partial prefetching are kept on (the Next.js 16 default
 * and the direction of the framework). Session-dependent UI therefore streams in
 * behind <Suspense> boundaries. See DECISIONS.md (ADR-007).
 */
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["pino", "nodemailer", "pg"],
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
