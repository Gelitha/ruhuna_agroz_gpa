import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    hasTouch: true
  },
  projects: [
    // Genuine WebKit - iPhone 14
    {
      name: 'Mobile-WebKit-iPhone14',
      use: {
        ...devices['iPhone 14']
      }
    },
    // Genuine WebKit - iPad Gen 7
    {
      name: 'Mobile-WebKit-iPad',
      use: {
        ...devices['iPad (gen 7)']
      }
    },
    // 320px - Narrow Android / iPhone SE 1st gen
    {
      name: 'Mobile-320px',
      use: {
        channel: 'chrome',
        viewport: { width: 320, height: 600 },
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
      }
    },
    // 360px - Standard Android Compact (Galaxy S8)
    {
      name: 'Mobile-360px',
      use: {
        channel: 'chrome',
        viewport: { width: 360, height: 740 },
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G950F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Mobile Safari/537.36'
      }
    },
    // 375px - iPhone SE / 8
    {
      name: 'Mobile-375px',
      use: {
        channel: 'chrome',
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
      }
    },
    // 390px - iPhone 13 / 14
    {
      name: 'Mobile-390px',
      use: {
        channel: 'chrome',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
      }
    },
    // 412px - Google Pixel 7 / Galaxy S20+
    {
      name: 'Mobile-412px',
      use: {
        channel: 'chrome',
        viewport: { width: 412, height: 915 },
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      }
    },
    // 430px - iPhone 14 Pro Max
    {
      name: 'Mobile-430px',
      use: {
        channel: 'chrome',
        viewport: { width: 430, height: 932 },
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
      }
    },
    // 768px - Tablet / iPad Mini Breakpoint
    {
      name: 'Tablet-768px',
      use: {
        channel: 'chrome',
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
      }
    }
  ],
  webServer: {
    command: 'npm run preview -- --port 4173',
    port: 4173,
    reuseExistingServer: true,
    timeout: 60000
  }
});
