import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Keep generated Next.js, Vinext, and Cloudflare output out of source linting.
  globalIgnores([
    ".next/**",
    ".vinext/**",
    ".wrangler/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
