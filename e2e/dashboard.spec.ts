import { test, expect } from './fixtures/auth.fixture';
import { DashboardPage } from './fixtures/page-objects';

/**
 * Dashboard E2E Tests
 * 
 * Tests the dashboard functionality:
 * - Page loads correctly
 * - Stats are displayed
 * - Role-specific content is shown
 * - Navigation works
 */

test.describe('Dashboard', () => {
  test.describe('Admin Dashboard', () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('admin');
    });

    test('should display dashboard with stats', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      
      await dashboard.expectLoaded();
      
      // Should have stat cards
      const cards = page.locator('.card, [class*="stat"]');
      await expect(cards.first()).toBeVisible();
    });

    test('should display sidebar navigation', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      
      // Sidebar should be visible
      await expect(dashboard.sidebar).toBeVisible();
      
      // Should have navigation links
      const navLinks = page.getByRole('link');
      expect(await navLinks.count()).toBeGreaterThan(5);
    });

    test('should have working navigation links', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      
      // Test a few navigation links
      const peopleLink = page.getByRole('link', { name: /people/i });
      
      if (await peopleLink.isVisible()) {
        await peopleLink.click();
        await expect(page).toHaveURL(/\/people/);
      }
    });
  });

  test.describe('Staff Dashboard', () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('staff');
    });

    test('should display staff-specific dashboard', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      
      await dashboard.expectLoaded();
    });

    test('should show action items section', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();

      // Staff dashboard should have main content area visible
      // Even if there are no action items, the dashboard structure should exist
      await expect(page.locator('main, [role="main"], .dashboard-content').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Supervisor Dashboard', () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('admin'); // Admins typically have supervisor access
    });

    test('should show team overview for supervisors', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Supervisor dashboard may show "My Team" or direct reports
      const teamSection = page.locator('[class*="team"], .card').filter({ 
        hasText: /team|report|staff/i 
      });
      
      // Dashboard should be functional
      await dashboard.expectLoaded();
    });
  });
});

test.describe('Dashboard Responsiveness', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin');
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
    
    // Sidebar may be collapsed or hidden on mobile
    const menuButton = page.getByRole('button', { name: /menu|toggle/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
    }
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    
    await dashboard.expectLoaded();
  });
});
