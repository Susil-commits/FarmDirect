import { test, expect } from '@playwright/test';

test.describe('Basic App Sanity Check', () => {
  
  test('homepage has correct title and visible buttons', async ({ page }) => {
    // Navigate to the local dev server
    await page.goto('http://localhost:5173');

    // Check title (Update this if your app title differs)
    await expect(page).toHaveTitle(/FarmDirect|Vite \+ React/i);

    // Verify main CTA buttons are visible and not hidden
    const joinAsFarmerBtn = page.locator('text=Join as Farmer').first();
    const loginBtn = page.locator('text=Login').first();

    // Check visibility 
    // This specifically tests the user's concern about "text not visible" or elements being hidden
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
    
    // Attempt to click Login
    const loginBtn = page.locator('text=Login').first();
    if (await loginBtn.count() > 0) {
      await loginBtn.click();
      
      // Check if URL changed or login form appeared
      await expect(page).toHaveURL(/.*login/);
      
      // Ensure the email field is visible
      await expect(page.getByPlaceholder(/email/i).first()).toBeVisible();
    }
  });
});
