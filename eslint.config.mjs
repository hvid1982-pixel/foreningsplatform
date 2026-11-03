import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "test-results/**",
    "playwright-report/**",
  ]),
  {
    // Business logic must not depend on the web framework: modules are plain
    // TypeScript so they can be tested and reused (see ARCHITECTURE.md).
    files: ["src/modules/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["next", "next/*"],
              message: "Modules must not import Next.js. Use src/server or src/app.",
            },
            { group: ["react", "react-dom"], message: "Modules must not import React." },
            {
              group: ["@/app/*", "@/components/*", "@/server/*"],
              message: "Modules must not import UI/server layers.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
