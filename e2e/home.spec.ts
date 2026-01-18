import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the welcome heading', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /welcome to my app/i })).toBeVisible();
  });

  test('should display the features list', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /features/i })).toBeVisible();
    await expect(page.getByText(/next\.js 15/i)).toBeVisible();
    await expect(page.getByText(/typescript/i)).toBeVisible();
  });

  test('should have a working example button', async ({ page }) => {
    await page.goto('/');

    const button = page.getByRole('button', { name: /click me/i });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/my app/i);
  });
});
