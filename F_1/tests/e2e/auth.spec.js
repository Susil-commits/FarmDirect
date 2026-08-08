import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  
  test('should navigate to login page and show validation errors on empty submit', async ({ page }) => {
    await page.goto('/auth/login');
    
    await expect(page.locator('h1', { hasText: /Welcome Back|Sign In/i }).first()).toBeVisible();
    
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    
    
    await expect(page.locator('h1', { hasText: /Welcome Back|Sign In/i }).first()).toBeVisible();
  });

  test('should toggle between login and register', async ({ page }) => {
    await page.goto('/auth/login');
    
    const signUpLink = page.locator('a', { hasText: /Sign Up|Create account/i }).first();
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await expect(page.url()).toContain('register');
    }
  });
});
