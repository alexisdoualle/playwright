// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  use: {
    baseURL: 'https://parabank.parasoft.com',
    extraHTTPHeaders: {
      'Accept': 'application/xml',
    },
    trace: 'on-first-retry',
  },
  reporter: [
    ['html'],
    ['list']
  ],
  projects: [
    {
      name: 'API Tests',
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: 'Chrome',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: /.*-ui\.spec\.ts/,
    }
  ],
});