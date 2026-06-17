import { defineConfig, devices } from '@playwright/test';

/**
 * Relay-independent E2E harness.
 *
 * The Field Trip relay (ws bridge to the user's Chrome) drops intermittently,
 * which made true end-to-end verification unreliable. This config runs headless
 * Chromium directly against a deployed URL — no relay, no extension, no flaky
 * bridge. Browsers are reused from the shared ~/.cache/ms-playwright cache.
 *
 * Auth: most admin surfaces are gated, but the CMS ships a read-only DEMO mode
 * on the `demo` subdomain (lib/demo.ts) that renders the exact same AdminShell
 * chrome with no login. So `https://demo.cncptweb.com/admin` is a genuine,
 * auth-free E2E target for verifying the shared admin UI.
 *
 *   E2E_BASE_URL=https://demo.cncptweb.com npx playwright test      # prod demo
 *   E2E_BASE_URL=http://localhost:3000     npx playwright test      # local dev
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'https://demo.cncptweb.com',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
});
