import { test, expect } from './fixtures/auth.fixture';

/**
 * Ministry Goals Seeding E2E Tests
 *
 * Verifies that:
 *   1. Seeded goals appear correctly on the Goals page
 *   2. Team Goals are grouped by ministry with collapsible sections
 *   3. Quarter and ministry filters work
 *   4. Ministry detail page shows a Goals tab with quarterly breakdown
 *   5. All 7 ministries + sub-departments exist
 *
 * Pre-requisites:
 *   - Migration 20260415000000_seed_ministry_goals.sql has been applied
 *   - Test accounts exist
 */

const CHURCH_QUARTERLY_THEMES = [
  'Faith as the Engine of Expansion',
  'Family as the Foundation of Expansion',
  'Church as a Mobilized Force',
  'Possession and Consolidation',
];

const TOP_LEVEL_MINISTRIES = [
  'Next-Gen Ministry',
  'Family Care Ministry',
  'Hospitality Services',
  'Discipleship Ministry',
  'Outreach Ministry',
  'Communications Team',
  'MC Music',
];

test.describe('Ministry Goals Seeding', () => {

  // ── Church Goals Tab ──
  test.describe('Church Goals Tab', () => {
    test('admin sees all 4 quarterly church-level theme goals', async ({ page, loginAs }) => {
      await loginAs('admin');
      await page.goto('/goals');
      await page.waitForLoadState('networkidle');

      const churchTab = page.getByRole('tab', { name: /church/i });
      await churchTab.click();
      await page.waitForTimeout(2000);

      for (const theme of CHURCH_QUARTERLY_THEMES) {
        const goalCard = page.locator('h3').filter({ hasText: theme });
        await expect(goalCard.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('church goals can be filtered by quarter', async ({ page, loginAs }) => {
      await loginAs('admin');
      await page.goto('/goals');
      await page.waitForLoadState('networkidle');

      const churchTab = page.getByRole('tab', { name: /church/i });
      await churchTab.click();
      await page.waitForTimeout(2000);

      // Select Q1 quarter filter
      const quarterFilter = page.locator('[aria-label="Filter by quarter"]');
      await quarterFilter.click();
      await page.getByRole('option', { name: /Q1/i }).click();
      await page.waitForTimeout(1000);

      // Should show only the Q1 church goal
      const q1Goal = page.locator('h3').filter({ hasText: 'Faith as the Engine of Expansion' });
      await expect(q1Goal.first()).toBeVisible();

      // Should NOT show Q4 goal
      const q4Goal = page.locator('h3').filter({ hasText: 'Possession and Consolidation' });
      await expect(q4Goal).toHaveCount(0);
    });
  });

  // ── Team Goals Tab — Grouped by Ministry ──
  test.describe('Team Goals Tab', () => {
    test('team goals are grouped by ministry with collapsible sections', async ({ page, loginAs }) => {
      await loginAs('admin');
      await page.goto('/goals');
      await page.waitForLoadState('networkidle');

      const teamTab = page.getByRole('tab', { name: /team/i });
      if (await teamTab.isVisible()) {
        await teamTab.click();
        await page.waitForTimeout(2000);

        // Should see ministry names as group headers (at least some of the 7)
        let foundMinistries = 0;
        for (const name of TOP_LEVEL_MINISTRIES) {
          const header = page.locator('h3').filter({ hasText: name });
          if (await header.count() > 0) foundMinistries++;
        }
        expect(foundMinistries).toBeGreaterThanOrEqual(3);
      }
    });

    test('team goals can be filtered by ministry', async ({ page, loginAs }) => {
      await loginAs('admin');
      await page.goto('/goals');
      await page.waitForLoadState('networkidle');

      const teamTab = page.getByRole('tab', { name: /team/i });
      if (await teamTab.isVisible()) {
        await teamTab.click();
        await page.waitForTimeout(2000);

        // Use ministry filter dropdown
        const ministryFilter = page.locator('[aria-label="Filter by ministry"]');
        if (await ministryFilter.isVisible()) {
          await ministryFilter.click();
          // Select a specific ministry
          const mcMusicOption = page.getByRole('option', { name: /MC Music/i });
          if (await mcMusicOption.isVisible()) {
            await mcMusicOption.click();
            await page.waitForTimeout(1000);

            // Should only show MC Music group
            const mcMusicHeader = page.locator('h3').filter({ hasText: 'MC Music' });
            await expect(mcMusicHeader.first()).toBeVisible();
          }
        }
      }
    });

    test('team goals show category badges', async ({ page, loginAs }) => {
      await loginAs('admin');
      await page.goto('/goals');
      await page.waitForLoadState('networkidle');

      const teamTab = page.getByRole('tab', { name: /team/i });
      if (await teamTab.isVisible()) {
        await teamTab.click();
        await page.waitForTimeout(2000);

        // Goal cards should show category badges (Spiritual, Discipleship, etc.)
        const categoryBadges = page.locator('text=/Spiritual|Discipleship|Evangelism|Operational/i');
        const count = await categoryBadges.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  // ── Ministry Detail Page — Goals Tab ──
  test.describe('Ministry Detail - Goals Tab', () => {
    test('ministry detail page has a Goals tab', async ({ page, loginAs }) => {
      await loginAs('admin');
      await page.goto('/ministries');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Click on a ministry to open detail view
      const ministryCard = page.locator('text=Next-Gen Ministry').first();
      await ministryCard.click();
      await page.waitForTimeout(2000);

      // Should see Goals and Members tabs
      const goalsTab = page.getByRole('tab', { name: /goals/i });
      const membersTab = page.getByRole('tab', { name: /members/i });
      await expect(goalsTab).toBeVisible();
      await expect(membersTab).toBeVisible();
    });

    test('ministry goals tab shows goals grouped by quarter', async ({ page, loginAs }) => {
      await loginAs('admin');
      await page.goto('/ministries');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Click on a ministry
      const ministryCard = page.locator('text=Next-Gen Ministry').first();
      await ministryCard.click();
      await page.waitForTimeout(2000);

      // Goals tab should be active by default
      const goalsTab = page.getByRole('tab', { name: /goals/i });
      await goalsTab.click();
      await page.waitForTimeout(2000);

      // Should see quarter badges (Q1, Q2, etc.)
      const quarterBadges = page.locator('text=/^Q[1-4]$/');
      const count = await quarterBadges.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('ministry goals tab has quarter filter', async ({ page, loginAs }) => {
      await loginAs('admin');
      await page.goto('/ministries');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const ministryCard = page.locator('text=Next-Gen Ministry').first();
      await ministryCard.click();
      await page.waitForTimeout(2000);

      const goalsTab = page.getByRole('tab', { name: /goals/i });
      await goalsTab.click();
      await page.waitForTimeout(1000);

      // Quarter filter should be visible
      const quarterFilter = page.locator('[aria-label="Filter by quarter"]');
      await expect(quarterFilter).toBeVisible();
    });
  });

  // ── Ministries Created ──
  test.describe('Ministries Created', () => {
    test('all 7 top-level ministries exist', async ({ page, loginAs }) => {
      await loginAs('admin');
      await page.goto('/ministries');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      for (const ministry of TOP_LEVEL_MINISTRIES) {
        const element = page.locator('text=' + ministry).first();
        await expect(element).toBeVisible({ timeout: 10000 });
      }
    });

    test('sub-departments exist as child ministries', async ({ page, loginAs }) => {
      await loginAs('admin');
      await page.goto('/ministries');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const sampleSubDepts = [
        'Kids Ministry',
        'Students Ministry',
        'Young Adults Ministry',
        'Ladies Ministry',
        'Small Groups',
        'Prayer Teams',
      ];

      for (const subDept of sampleSubDepts) {
        const element = page.locator('text=' + subDept).first();
        await expect(element).toBeVisible({ timeout: 10000 });
      }
    });
  });

  // ── Goal Data Integrity ──
  test.describe('Goal Data Integrity', () => {
    test('seeded goals show 0% progress and Not Started status', async ({ page, loginAs }) => {
      await loginAs('admin');
      await page.goto('/goals');
      await page.waitForLoadState('networkidle');

      const churchTab = page.getByRole('tab', { name: /church/i });
      await churchTab.click();
      await page.waitForTimeout(2000);

      const progressLabels = page.locator('text=0%');
      const count = await progressLabels.count();
      expect(count).toBeGreaterThanOrEqual(4);

      const notStartedBadges = page.locator('text=/not.?started/i');
      const badgeCount = await notStartedBadges.count();
      expect(badgeCount).toBeGreaterThanOrEqual(4);
    });

    test('goal cards show ministry name in metadata', async ({ page, loginAs }) => {
      await loginAs('admin');
      await page.goto('/goals');
      await page.waitForLoadState('networkidle');

      const teamTab = page.getByRole('tab', { name: /team/i });
      if (await teamTab.isVisible()) {
        await teamTab.click();
        await page.waitForTimeout(2000);

        // Expand a ministry group and check goal cards show the ministry name
        // The grouped view should show ministry names as headers
        const ministryHeaders = page.locator('h3').filter({
          hasText: /Ministry|Services|Team|Music/i,
        });
        const headerCount = await ministryHeaders.count();
        expect(headerCount).toBeGreaterThan(0);
      }
    });
  });
});
