import { defineConfig, devices } from "@playwright/test";

// Smoke tests for what an anonymous visitor sees, against a production build (run
// `npm run build` first). They read the real database through the anon key only.
// SUPABASE_SERVICE_ROLE_KEY is overridden so test traffic never bumps the live visit
// counter (Next doesn't override variables already in the environment).
export default defineConfig({
  testDir: "tests/e2e",
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure", ...devices["Desktop Chrome"] },
  webServer: {
    // Never reuse: a leftover server would keep testing an old build.
    command: "node node_modules/next/dist/bin/next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { SUPABASE_SERVICE_ROLE_KEY: "invalid" },
  },
});
