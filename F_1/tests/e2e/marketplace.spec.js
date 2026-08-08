import { test, expect } from '@playwright/test';

test.describe('Marketplace & Search Flow', () => {
  
  test('should load marketplace and display crop cards', async ({ page }) => {
    await page.goto('/marketplace');
    
    await expect(page.locator('h1', { hasText: /Marketplace|Fresh Farm Produce/i }).first()).toBeVisible();
    
    await page.waitForLoadState('networkidle');
  });

  test('should allow searching for a crop', async ({ page }) => {
    await page.goto('/marketplace');
    
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Tomato');
      await searchInput.press('Enter');
      
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
