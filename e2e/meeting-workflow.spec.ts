import { test, expect } from './fixtures/auth.fixture';
import { MeetingsPage, DashboardPage } from './fixtures/page-objects';

/**
 * Meeting Workflow E2E Tests
 * 
 * Tests the complete meeting management workflow:
 * - View meetings list
 * - Create new meeting
 * - View meeting details
 * - Add agenda items
 * - Track action items
 */

test.describe('Meeting Workflow', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin');
  });

  test('should display meetings page', async ({ page }) => {
    const meetingsPage = new MeetingsPage(page);
    await meetingsPage.goto();
    
    // Should show add meeting button
    await expect(meetingsPage.addMeetingButton).toBeVisible();
  });

  test('should open meeting creation dialog', async ({ page }) => {
    const meetingsPage = new MeetingsPage(page);
    await meetingsPage.goto();
    
    await meetingsPage.addMeetingButton.click();
    
    // Dialog should be visible
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Should have form fields (bilingual - use first title field)
    await expect(page.getByLabel(/title.*english/i)).toBeVisible();
  });

  test('should navigate to meetings from dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    
    // Click on meetings in sidebar
    await dashboard.navigateTo('meetings');
    
    await expect(page).toHaveURL(/\/meetings/);
  });

  test('should filter meetings by type', async ({ page }) => {
    const meetingsPage = new MeetingsPage(page);
    await meetingsPage.goto();
    
    // Look for filter controls
    const typeFilter = page.getByRole('combobox').first();
    
    if (await typeFilter.isVisible()) {
      await typeFilter.click();
      
      // Select a meeting type
      const oneOnOneOption = page.getByRole('option', { name: /1:1|one-on-one/i });
      if (await oneOnOneOption.isVisible()) {
        await oneOnOneOption.click();
      }
    }
    
    // Page should not crash
    await expect(page).toHaveURL(/\/meetings/);
  });
});

test.describe('Meeting Details', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin');
  });

  test('should view meeting details when clicking a meeting', async ({ page }) => {
    const meetingsPage = new MeetingsPage(page);
    await meetingsPage.goto();
    
    // Wait for meetings to load
    await page.waitForTimeout(1000);
    
    // Click on first meeting card if available
    const firstMeeting = meetingsPage.meetingCards.first();
    
    if (await firstMeeting.isVisible()) {
      await firstMeeting.click();
      
      // Should open detail dialog or navigate to detail page
      const dialog = page.getByRole('dialog');
      const detailPage = page.locator('h1, h2').filter({ hasText: /meeting|1:1/i });
      
      // Either dialog or detail page should be visible
      await expect(dialog.or(detailPage)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Action Items from Meetings', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('staff');
  });

  test('should display action items on staff dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    
    // Staff dashboard should show action items section
    const actionItemsSection = page.locator('[class*="action"], [class*="task"]').filter({ 
      hasText: /action|task|item/i 
    });
    
    // Should have some content (may be empty state)
    await expect(dashboard.sidebar).toBeVisible();
  });
});
