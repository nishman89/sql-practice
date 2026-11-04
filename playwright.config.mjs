// Browser tests for the built site. Run `npm run build` first; Playwright starts a local server for dist/.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  // the JSON results feed the test dashboard (scripts/report.mjs); the HTML report becomes its 'full technical report'
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'reports/e2e.json' }], ...(process.env.CI ? [['github']] : [])],
  use: {
    baseURL: 'http://localhost:4173/sql-practice/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // WebGL for the game, without a graphics card
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1360, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec/ },
  ],
  webServer: { command: 'node scripts/serve.mjs', url: 'http://localhost:4173/sql-practice/', reuseExistingServer: !process.env.CI, timeout: 30_000 },
});
