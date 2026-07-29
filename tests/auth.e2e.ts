import { expect, test } from '@playwright/test';

test('the authenticated organization flow works', async ({ page, request }) => {
	const health = await request.get('/api/health');
	expect(health.ok()).toBe(true);
	await expect(health.json()).resolves.toMatchObject({
		ok: true,
		database: 'ready'
	});

	const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	await page.goto('/');
	await page.getByRole('link', { name: 'Get started' }).click();
	await page.getByLabel('Name').fill('Starter Test User');
	await page.getByLabel('Email').fill(`starter-${suffix}@example.com`);
	await page.getByLabel('Password').fill(`Test-${suffix}-password`);
	await page.getByRole('button', { name: 'Create account' }).click();

	await expect(page).toHaveURL(/\/onboarding$/);
	await page.getByLabel('Organization name').fill(`Starter Test ${suffix}`);
	await page.getByRole('button', { name: 'Create organization' }).click();

	await expect(page).toHaveURL(/\/app$/);
	await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
	await expect(page.getByText('Your organization is ready.')).toBeVisible();
});
