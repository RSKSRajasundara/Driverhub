import { expect, test } from '@playwright/test';

test.describe('DriveHub UI smoke tests', () => {
  test('home page renders key sections', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'DriveHub' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Find Your Perfect Rental Car' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Available Vehicles' })).toBeVisible();

    const vehicleLinks = page.locator('a[href^="/vehicles/"]');
    await expect(vehicleLinks).toHaveCount(4);
  });

  test('login and register pages are reachable', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByRole('heading', { name: 'Login to Your Account' })).toBeVisible();

    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/\/auth\/register$/);
    await expect(page.getByRole('heading', { name: 'Create Your Account' })).toBeVisible();
  });

  test('user can login and sees authenticated header state', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByPlaceholder('you@example.com').fill('user@example.com');
    await page.getByPlaceholder('••••••••').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'My Bookings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('booking CTA redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/vehicles/1');

    await expect(page.getByRole('heading', { name: 'Toyota Camry' })).toBeVisible();
    await page.getByRole('button', { name: 'Login to Book' }).click();

    await expect(page).toHaveURL(/\/auth\/login$/);
  });
});
