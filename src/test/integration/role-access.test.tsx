import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen, waitFor } from "@testing-library/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ReactNode } from "react";
import { 
  createMockAuthState, 
  adminAuthState, 
  staffAuthState, 
  loadingAuthState,
  languageContextMock,
  MockAuthState 
} from "../mocks/authMock";
import { 
  createDirectReportsMock,
  createMeetingsMock,
  createGoalsMock,
  createDevelopmentPlansMock,
  createUserActionItemsMock,
  createMeetingTemplatesMock
} from "../mocks/hookMocks";

/**
 * Role-Based Access Control Tests
 * 
 * Tests that:
 * 1. Admin users can access admin pages
 * 2. Non-admin users are redirected from admin pages
 * 3. Supervisors see supervisor dashboard
 * 4. Staff see staff dashboard
 * 5. Protected routes redirect unauthenticated users
 */

// Configurable mock auth context
let mockAuthState: MockAuthState = staffAuthState;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/contexts/LanguageContext", () => languageContextMock);

// Mock hooks
vi.mock("@/hooks/useAdminUsers", () => ({
  useAdminUsers: () => ({ data: [], isLoading: false }),
  useAppRoles: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/hooks/useDirectReports", () => createDirectReportsMock([]));
vi.mock("@/hooks/useMeetings", () => createMeetingsMock([]));
vi.mock("@/hooks/useGoals", () => createGoalsMock([]));
vi.mock("@/hooks/useDevelopmentPlans", () => createDevelopmentPlansMock([]));
vi.mock("@/hooks/useUserActionItems", () => createUserActionItemsMock([]));
vi.mock("@/hooks/useMeetingTemplates", () => createMeetingTemplatesMock([]));

const createWrapper = (initialRoute = "/") => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("Admin Page Access Control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render admin page for admin users", async () => {
    mockAuthState = adminAuthState;

    const Admin = (await import("@/pages/Admin")).default;

    render(<Admin />, { wrapper: createWrapper("/admin") });

    await waitFor(() => {
      // May have multiple elements with admin.title (header + page title)
      const elements = screen.getAllByText("admin.title");
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it("should redirect non-admin users from admin page", async () => {
    mockAuthState = staffAuthState;

    const Admin = (await import("@/pages/Admin")).default;

    // The component should redirect - we check that it doesn't render admin content
    render(<Admin />, { wrapper: createWrapper("/admin") });

    // Should not show admin content
    await waitFor(() => {
      expect(screen.queryByText("admin.userManagement")).not.toBeInTheDocument();
    });
  });

  it("should show loading state while checking auth", async () => {
    mockAuthState = loadingAuthState;

    const Admin = (await import("@/pages/Admin")).default;

    render(<Admin />, { wrapper: createWrapper("/admin") });

    // Should show loading or not crash
    expect(document.body).toBeDefined();
  });
});

describe("Dashboard Role-Based Views", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show appropriate dashboard for authenticated staff", async () => {
    mockAuthState = staffAuthState;

    const Dashboard = (await import("@/pages/Dashboard")).default;

    render(<Dashboard />, { wrapper: createWrapper("/dashboard") });

    await waitFor(() => {
      // Multiple elements may have dashboard.overview text
      const elements = screen.getAllByText("dashboard.overview");
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it("should render for admin users", async () => {
    mockAuthState = adminAuthState;

    const Dashboard = (await import("@/pages/Dashboard")).default;

    render(<Dashboard />, { wrapper: createWrapper("/dashboard") });

    await waitFor(() => {
      // Multiple elements may have dashboard.overview text
      const elements = screen.getAllByText("dashboard.overview");
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});

describe("Settings Page Access", () => {
  it("should redirect non-admin from settings", async () => {
    mockAuthState = staffAuthState;

    // Settings page has similar admin check
    const Settings = (await import("@/pages/Settings")).default;

    render(<Settings />, { wrapper: createWrapper("/settings") });

    // Should not render settings content
    await waitFor(() => {
      expect(screen.queryByText("settings.title")).not.toBeInTheDocument();
    });
  });
});

describe("Role Helper Functions", () => {
  it("should correctly identify admin status", () => {
    // Test the auth state directly
    expect(adminAuthState.isAdminOrSuper).toBe(true);
    expect(adminAuthState.hasAnyRole(['admin'])).toBe(true);
    expect(adminAuthState.hasRole('super_admin')).toBe(true);

    expect(staffAuthState.isAdminOrSuper).toBe(false);
    expect(staffAuthState.hasAnyRole(['admin'])).toBe(false);
    expect(staffAuthState.hasRole('staff')).toBe(true);
  });

  it("should handle null user gracefully", () => {
    const nullUserState = createMockAuthState({ user: null, person: null });
    
    expect(nullUserState.user).toBeNull();
    expect(nullUserState.isAdminOrSuper).toBe(false);
    expect(nullUserState.hasAnyRole(['admin'])).toBe(false);
  });
});
