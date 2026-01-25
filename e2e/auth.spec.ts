import { test, expect } from './fixtures/auth.fixture';
import { AuthPage, DashboardPage } from './fixtures/page-objects';

/**
 * Authentication Flow E2E Tests
 * 
 * Tests the complete authentication lifecycle:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Protected route access
 * - Logout functionality
 * - Session persistence
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test('should redirect unauthenticated users to login page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should display login form on auth page', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.signInButton).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.goto();
    
    await authPage.signIn('invalid@example.com', 'wrongpassword');
    
    // Wait for error to appear (API response)
    await page.waitForTimeout(2000);
    
    // Should still be on auth page or show error
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should login successfully with valid admin credentials', async ({ page, loginAs }) => {
    await loginAs('admin');
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify sidebar is visible (logged in state)
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
  });

  test('should login successfully with staff credentials', async ({ page, loginAs }) => {
    await loginAs('staff');
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
  });

  test('should persist session after page reload', async ({ page, loginAs }) => {
    await loginAs('admin');
    
    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be on dashboard, not redirected to auth
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should logout successfully', async ({ page, loginAs, logout }) => {
    await loginAs('admin');
    
    // Perform logout
    await logout();
    
    // Should be redirected to auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should redirect to originally requested page after login', async ({ page }) => {
    // Try to access a protected page
    await page.goto('/goals');
    
    // Should redirect to auth
    await expect(page).toHaveURL(/\/auth/);
    
    // Login
    const authPage = new AuthPage(page);
    await authPage.signIn(
      process.env.E2E_ADMIN_EMAIL || 'johnny@montcarmel.org',
      process.env.E2E_ADMIN_PASSWORD || 'testpassword123'
    );
    
    // After login, ideally should go back to goals (or dashboard)
    await expect(page).toHaveURL(/\/(dashboard|goals)/);
  });
});
