import { test as base, Page, expect } from '@playwright/test';

/**
 * Authentication Fixtures for E2E Tests
 * Provides reusable authentication helpers
 */

// Test user credentials (use environment variables in CI)
// Default accounts use Gmail + addressing pattern (all go to same inbox)
export const TEST_USERS = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'bideldjiki+admin@gmail.com',
    password: process.env.E2E_ADMIN_PASSWORD || 'testpassword@123',
  },
  staff: {
    email: process.env.E2E_STAFF_EMAIL || 'bideldjiki+staff1@gmail.com',
    password: process.env.E2E_STAFF_PASSWORD || 'testpassword@123',
  },
  volunteer: {
    email: process.env.E2E_VOLUNTEER_EMAIL || 'bideldjiki+volunteer@gmail.com',
    password: process.env.E2E_VOLUNTEER_PASSWORD || 'testpassword@123',
  },
  pastor: {
    email: process.env.E2E_PASTOR_EMAIL || 'bideldjiki+pastor@gmail.com',
    password: process.env.E2E_PASTOR_PASSWORD || 'testpassword@123',
  },
  staff2: {
    email: process.env.E2E_STAFF2_EMAIL || 'bideldjiki+staff2@gmail.com',
    password: process.env.E2E_STAFF2_PASSWORD || 'testpassword@123',
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

      // Wait for login form to be visible (avoid networkidle - Supabase keeps connections open)
      await page.getByRole('button', { name: /login|connexion/i }).waitFor({ state: 'visible' });

      // Fill login form
      await page.getByLabel(/email/i).fill(user.email);
      await page.getByLabel(/password/i).fill(user.password);
      
      // Submit and wait for navigation (button text is "Login" or "Connexion" in FR)
      await page.getByRole('button', { name: /login|connexion/i }).click();
      
      // Wait for redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    };
    
    await use(loginAs);
  },
  
  logout: async ({ page }, use) => {
    const logout = async () => {
      // Open the "More" menu in the bottom nav (mobile) or user dropdown
      const moreButton = page.getByRole('button', { name: /more/i });
      if (await moreButton.isVisible()) {
        await moreButton.click();
        // Wait for menu animation to complete (Mobile Safari needs this)
        await page.waitForTimeout(300);
      }

      // Now find and click logout - try menuitem role first (dropdown menu), then button
      const logoutLocator = page
        .getByRole('menuitem', { name: /log out|sign out|logout|déconnexion/i })
        .or(page.getByRole('button', { name: /log out|sign out|logout|déconnexion/i }));
      await logoutLocator.first().waitFor({ state: 'visible', timeout: 5000 });
      await logoutLocator.first().click();

      // Wait for redirect to auth page
      await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });
    };

    await use(logout);
  },
});

export { expect } from '@playwright/test';
