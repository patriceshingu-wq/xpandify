import { test as base, Page, expect } from '@playwright/test';

/**
 * Authentication Fixtures for E2E Tests
 * Provides reusable authentication helpers
 */

// Test user credentials (use environment variables in CI)
export const TEST_USERS = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'johnny@montcarmel.org',
    password: process.env.E2E_ADMIN_PASSWORD || 'testpassword123',
  },
  staff: {
    email: process.env.E2E_STAFF_EMAIL || 'deo@montcarmel.org',
    password: process.env.E2E_STAFF_PASSWORD || 'testpassword123',
  },
  volunteer: {
    email: process.env.E2E_VOLUNTEER_EMAIL || 'cris@montcarmel.org',
    password: process.env.E2E_VOLUNTEER_PASSWORD || 'testpassword123',
  },
};

export type UserRole = keyof typeof TEST_USERS;

// Extended test fixture with authentication helpers
export const test = base.extend<{
  loginAs: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}>({
  loginAs: async ({ page }, use) => {
    const loginAs = async (role: UserRole) => {
      const user = TEST_USERS[role];
      
      await page.goto('/auth');
      await page.waitForLoadState('networkidle');
      
      // Fill login form
      await page.getByLabel(/email/i).fill(user.email);
      await page.getByLabel(/password/i).fill(user.password);
      
      // Submit and wait for navigation
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      
      // Wait for redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    };
    
    await use(loginAs);
  },
  
  logout: async ({ page }, use) => {
    const logout = async () => {
      // Click logout button (may be in sidebar or header)
      const logoutButton = page.getByRole('button', { name: /log out|sign out|logout/i });
      
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });
      }
    };
    
    await use(logout);
  },
});

export { expect } from '@playwright/test';
