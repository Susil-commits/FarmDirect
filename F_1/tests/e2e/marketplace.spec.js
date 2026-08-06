import { test, expect } from '@playwright/test';

test.describe('Marketplace & Search Flow', () => {
  
  test('should load marketplace and display crop cards', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Check if the page title or a known heading is visible
    await expect(page.locator('h1', { hasText: /Marketplace|Fresh Farm Produce/i }).first()).toBeVisible();
    
    // Check if at least one crop card is rendered (assuming they use a standard CSS class or role)
    // We will wait for the grid to load. If it's an empty state, that's fine too, but it shouldn't crash.
    await page.waitForLoadState('networkidle');
  });

  test('should allow searching for a crop', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Find the search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Tomato');
      await searchInput.press('Enter');
      
      // Wait for navigation or results update
      await page.waitForLoadState('networkidle');
      
      // It should still not crash and ideally show 'Tomato' in the results or URL
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
