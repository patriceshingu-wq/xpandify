import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Models for E2E Tests
 * Encapsulates page interactions for maintainability
 */

export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly signUpButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.signInButton = page.getByRole('button', { name: /login|connexion/i });
    this.signUpButton = page.getByRole('button', { name: /signup|inscription/i });
    this.errorMessage = page.locator('[role="alert"], .error-message, [data-testid="error"]');
  }

  async goto() {
    await this.page.goto('/auth');
    await this.page.waitForLoadState('networkidle');
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async expectError(message?: string | RegExp) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }
}

export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly sidebar: Locator;
  readonly statsCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1, .page-title').first();
    this.sidebar = page.locator('aside, [role="navigation"]').first();
    this.statsCards = page.locator('[class*="stat"], .card').filter({ hasText: /total|active|progress/i });
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoaded() {
    await expect(this.sidebar).toBeVisible();
  }

  async navigateTo(path: string) {
    await this.page.getByRole('link', { name: new RegExp(path, 'i') }).click();
    await this.page.waitForLoadState('networkidle');
  }
}

export class MeetingsPage {
  readonly page: Page;
  readonly addMeetingButton: Locator;
  readonly meetingsList: Locator;
  readonly meetingCards: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use first() to handle multiple matching buttons (header + empty state)
    this.addMeetingButton = page.getByRole('button', { name: /schedule meeting|planifier/i }).first();
    this.meetingsList = page.locator('[class*="meeting"], .meeting-list, [data-testid="meetings"]');
    this.meetingCards = page.locator('[class*="card"]').filter({ hasText: /1:1|meeting|team/i });
  }

  async goto() {
    await this.page.goto('/meetings');
    await this.page.waitForLoadState('networkidle');
  }

  async createMeeting(title: string, type: string = 'one_on_one') {
    await this.addMeetingButton.click();
    
    // Fill meeting form (adjust selectors based on actual form)
    await this.page.getByLabel(/title/i).fill(title);
    
    // Submit
    await this.page.getByRole('button', { name: /save|create|submit/i }).click();
    
    // Wait for dialog to close
    await expect(this.page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  }
}

export class GoalsPage {
  readonly page: Page;
  readonly addGoalButton: Locator;
  readonly goalsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addGoalButton = page.getByRole('button', { name: /add goal|new goal|create/i });
    this.goalsList = page.locator('[class*="goal"], .goals-list');
  }

  async goto() {
    await this.page.goto('/goals');
    await this.page.waitForLoadState('networkidle');
  }
}

export class AdminPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly userManagementTab: Locator;
  readonly accessDenied: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use first() to avoid strict mode violation when multiple h1s exist
    this.pageTitle = page.locator('h1').filter({ hasText: /administration/i }).first();
    this.userManagementTab = page.getByRole('tab', { name: /user/i });
    this.accessDenied = page.locator('[class*="access-denied"], [class*="unauthorized"]');
  }

  async goto() {
    await this.page.goto('/admin');
    await this.page.waitForLoadState('networkidle');
  }

  async expectAccessAllowed() {
    // Check we're on admin page and can see the title
    await expect(this.page).toHaveURL(/\/admin/);
    await expect(this.pageTitle).toBeVisible();
  }

  async expectAccessDenied() {
    // Non-admins should be redirected to dashboard
    await expect(this.page).toHaveURL(/\/dashboard/);
  }
}
