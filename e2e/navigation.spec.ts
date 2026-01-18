import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load home page successfully', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.status()).toBe(200);
  });

  test('should have react-basecamp link', async ({ page }) => {
    await page.goto('/');

    const link = page.getByRole('link', { name: /react-basecamp/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /github\.com/);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  });

  test('should handle 404 for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');

    expect(response?.status()).toBe(404);
  });
});
