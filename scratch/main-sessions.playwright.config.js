import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: '../tests/e2e',
  use: { baseURL: 'http://127.0.0.1:4176', browserName: 'chromium' },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4176', cwd: 'D:/Project/SpaManagement/spa-management-frontend-main', url: 'http://127.0.0.1:4176/login', reuseExistingServer: false, timeout: 60_000 },
})