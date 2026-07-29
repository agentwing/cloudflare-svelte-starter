import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	testMatch: '**/*.e2e.ts',
	use: {
		baseURL: 'http://127.0.0.1:8787',
		trace: 'retain-on-failure'
	},
	webServer: {
		command:
			'pnpm build && CI=true pnpm db:migrate:local && pnpm exec wrangler dev --port 8787 --var BETTER_AUTH_SECRET:test-only-secret-with-at-least-32-characters',
		url: 'http://127.0.0.1:8787/api/health',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
