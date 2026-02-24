import { test, expect } from './fixtures/auth.fixture';
import AxeBuilder from '@axe-core/playwright';

// Pages to audit (public/auth pages that don't require login)
const publicPages = [
  { name: 'Auth/Login', path: '/auth' },
];

// Pages that require authentication
const authenticatedPages = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'People', path: '/people' },
  { name: 'Goals', path: '/goals' },
  { name: 'Meetings', path: '/meetings' },
  { name: 'Calendar', path: '/events' },
  { name: 'Ministries', path: '/ministries' },
];

test.describe('Accessibility Audit - Public Pages', () => {
  for (const pageInfo of publicPages) {
    test(`${pageInfo.name} should have no critical accessibility violations`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log(`\n=== ${pageInfo.name} Accessibility Violations ===`);
        accessibilityScanResults.violations.forEach((violation) => {
          console.log(`\n[${violation.impact?.toUpperCase()}] ${violation.id}: ${violation.description}`);
          console.log(`  Help: ${violation.helpUrl}`);
          violation.nodes.forEach((node, i) => {
            console.log(`  Node ${i + 1}: ${node.html.substring(0, 100)}...`);
          });
        });
      }

      // Filter for critical/serious issues only
      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });
  }
});

test.describe('Accessibility Audit - Authenticated Pages', () => {
  for (const pageInfo of authenticatedPages) {
    test(`${pageInfo.name} should have no critical accessibility violations`, async ({ page, loginAs }) => {
      // Login first
      await loginAs('admin');

      await page.goto(pageInfo.path);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log(`\n=== ${pageInfo.name} Accessibility Violations ===`);
        accessibilityScanResults.violations.forEach((violation) => {
          console.log(`\n[${violation.impact?.toUpperCase()}] ${violation.id}: ${violation.description}`);
          console.log(`  Help: ${violation.helpUrl}`);
          violation.nodes.forEach((node, i) => {
            console.log(`  Node ${i + 1}: ${node.html.substring(0, 100)}...`);
          });
        });
      }

      // Filter for critical/serious issues only
      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });
  }
});
