import { test, expect } from './fixtures/auth.fixture';
import { AdminPage, DashboardPage } from './fixtures/page-objects';

/**
 * Role-Based Access Control E2E Tests
 * 
 * Tests that different user roles have appropriate access:
 * - Admin users can access admin pages
 * - Staff users cannot access admin pages
 * - All authenticated users can access dashboard
 * - Sidebar shows appropriate navigation based on role
 */

test.describe('Role-Based Access Control', () => {
  test.describe('Admin Access', () => {
    test('admin user can access admin page', async ({ page, loginAs }) => {
      await loginAs('admin');
      
      const adminPage = new AdminPage(page);
      await adminPage.goto();
      
      await adminPage.expectAccessAllowed();
    });

    test('admin user can access settings page', async ({ page, loginAs }) => {
      await loginAs('admin');
      
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      // Admin should see settings content
      await expect(page.locator('h1, .page-title')).toBeVisible();
    });

    test('admin user sees admin navigation items', async ({ page, loginAs }) => {
      await loginAs('admin');
      
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      
      // Admin should see admin link in sidebar
      const adminLink = page.getByRole('link', { name: /admin/i });
      await expect(adminLink).toBeVisible();
    });
  });

  test.describe('Staff Access', () => {
    test('staff user is redirected from admin page', async ({ page, loginAs }) => {
      await loginAs('staff');
      
      const adminPage = new AdminPage(page);
      await adminPage.goto();
      
      await adminPage.expectAccessDenied();
    });

    test('staff user can access dashboard', async ({ page, loginAs }) => {
      await loginAs('staff');
      
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      
      await dashboard.expectLoaded();
    });

    test('staff user can access meetings page', async ({ page, loginAs }) => {
      await loginAs('staff');
      
      await page.goto('/meetings');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/\/meetings/);
    });

    test('staff user does not see admin navigation items', async ({ page, loginAs }) => {
      await loginAs('staff');
      
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      
      // Staff should NOT see admin link (or it should be hidden)
      const adminLink = page.getByRole('link', { name: /^admin$/i });
      await expect(adminLink).not.toBeVisible();
    });
  });

  test.describe('Volunteer Access', () => {
    test('volunteer user can access dashboard', async ({ page, loginAs }) => {
      await loginAs('volunteer');
      
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      
      await dashboard.expectLoaded();
    });

    test('volunteer user is redirected from admin page', async ({ page, loginAs }) => {
      await loginAs('volunteer');
      
      const adminPage = new AdminPage(page);
      await adminPage.goto();
      
      await adminPage.expectAccessDenied();
    });
  });
});

test.describe('Navigation Access', () => {
  test('authenticated user can navigate between main pages', async ({ page, loginAs }) => {
    await loginAs('staff');
    
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    
    // Navigate to people
    await dashboard.navigateTo('people');
    await expect(page).toHaveURL(/\/people/);
    
    // Navigate to goals
    await dashboard.navigateTo('goals');
    await expect(page).toHaveURL(/\/goals/);
    
    // Navigate to meetings
    await dashboard.navigateTo('meetings');
    await expect(page).toHaveURL(/\/meetings/);
    
    // Navigate back to dashboard
    await dashboard.navigateTo('dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
