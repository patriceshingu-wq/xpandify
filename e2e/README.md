# E2E Tests with Playwright

This directory contains end-to-end tests for the Expandify application using Playwright.

## Prerequisites

1. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

2. Set up test user credentials (optional - uses defaults if not set):
   ```bash
   export E2E_ADMIN_EMAIL="johnny@montcarmel.org"
   export E2E_ADMIN_PASSWORD="your-password"
   export E2E_STAFF_EMAIL="deo@montcarmel.org"
   export E2E_STAFF_PASSWORD="your-password"
   export E2E_VOLUNTEER_EMAIL="cris@montcarmel.org"
   export E2E_VOLUNTEER_PASSWORD="your-password"
   ```

## Running Tests

### Run all tests
```bash
npx playwright test
```

### Run tests in UI mode (recommended for debugging)
```bash
npx playwright test --ui
```

### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests for specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug a specific test
```bash
npx playwright test e2e/auth.spec.ts --debug
```

## Test Structure

```
e2e/
├── fixtures/
│   ├── auth.fixture.ts     # Authentication helpers and test users
│   └── page-objects.ts     # Page Object Models for each page
├── auth.spec.ts            # Authentication flow tests
├── role-access.spec.ts     # Role-based access control tests
├── meeting-workflow.spec.ts # Meeting management workflow tests
├── dashboard.spec.ts       # Dashboard functionality tests
└── README.md               # This file
```

## Page Objects

We use the Page Object Model pattern for maintainability:

- `AuthPage` - Login/signup page interactions
- `DashboardPage` - Dashboard navigation and stats
- `MeetingsPage` - Meeting list and creation
- `GoalsPage` - Goals management
- `AdminPage` - Admin-only functionality

## Test Categories

### Authentication Tests (`auth.spec.ts`)
- Login with valid/invalid credentials
- Session persistence
- Logout functionality
- Protected route access

### Role-Based Access Tests (`role-access.spec.ts`)
- Admin page access by role
- Settings page access
- Navigation visibility by role

### Meeting Workflow Tests (`meeting-workflow.spec.ts`)
- View meetings list
- Create new meeting
- View meeting details
- Action item tracking

### Dashboard Tests (`dashboard.spec.ts`)
- Dashboard loading
- Stats display
- Role-specific views
- Responsive behavior

## Configuration

See `playwright.config.ts` in the project root for:
- Browser configurations
- Timeout settings
- Base URL
- Screenshot and video recording settings

## CI Integration

Tests are configured to:
- Retry failed tests twice on CI
- Capture traces on first retry
- Record video on failure
- Generate HTML reports

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if the app is running on the correct port

### Authentication failing
- Verify test user credentials in environment variables
- Check if email confirmation is enabled (disable for testing)

### Element not found
- Update selectors in page objects
- Add `await page.waitForLoadState('networkidle')`
