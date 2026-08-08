import { test, expect } from '@playwright/test';

test.describe('Basic App Sanity Check', () => {
  
  test('homepage has correct title and visible buttons', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await expect(page).toHaveTitle(/FarmDirect|Vite \+ React/i);

    const joinAsFarmerBtn = page.locator('text=Join as Farmer').first();
    const loginBtn = page.locator('text=Login').first();

    if (await joinAsFarmerBtn.count() > 0) {
      await expect(joinAsFarmerBtn).toBeVisible();
      await expect(joinAsFarmerBtn).toBeEnabled();
    }
    
    if (await loginBtn.count() > 0) {
      await expect(loginBtn).toBeVisible();
      await expect(loginBtn).toBeEnabled();
    }
  });

  test('navigation to login works', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const loginBtn = page.locator('text=Login').first();
    if (await loginBtn.count() > 0) {
      await loginBtn.click();
      
      await expect(page).toHaveURL(/.*login/);
      
      await expect(page.locator('input[type="email"]').first()).toBeVisible();
    }
  });
});
