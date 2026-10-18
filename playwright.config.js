// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * 測試會自己起一個靜態伺服器（跟攤位現場的用法一樣）。
 * 跑法：npx playwright test
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 90 * 1000,
  expect: { timeout: 8 * 1000 },
  fullyParallel: false,          // 遊戲有計時，平行跑會互相影響時間判斷
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8765',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } }
  ],
  webServer: {
    command: 'python -m http.server 8765',
    url: 'http://127.0.0.1:8765/index.html',
    reuseExistingServer: true,
    timeout: 30 * 1000
  }
});
