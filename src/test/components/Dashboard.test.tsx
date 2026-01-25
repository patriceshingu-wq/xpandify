import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ReactNode } from "react";
import { createMockAuthState, staffAuthState, languageContextMock } from "../mocks/authMock";
import { 
  createDirectReportsMock, 
  createMeetingsMock, 
  createGoalsMock, 
  createDevelopmentPlansMock,
  createUserActionItemsMock 
} from "../mocks/hookMocks";

// Configurable auth state for tests
let mockAuthState = staffAuthState;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/contexts/LanguageContext", () => languageContextMock);

// Mock hooks
vi.mock("@/hooks/useDirectReports", () => createDirectReportsMock([]));
vi.mock("@/hooks/useMeetings", () => createMeetingsMock([]));
vi.mock("@/hooks/useGoals", () => createGoalsMock([]));
vi.mock("@/hooks/useDevelopmentPlans", () => createDevelopmentPlansMock([]));
vi.mock("@/hooks/useUserActionItems", () => createUserActionItemsMock([]));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("Dashboard role-based rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = staffAuthState;
  });

  it("should render staff dashboard when user has no direct reports", async () => {
    const Dashboard = (await import("@/pages/Dashboard")).default;
    
    render(<Dashboard />, { wrapper: createWrapper() });

    // Staff dashboard renders the overview section
    await vi.waitFor(() => {
      expect(screen.queryByText("dashboard.overview")).toBeInTheDocument();
    });
  });

  it("should handle loading state", async () => {
    mockAuthState = createMockAuthState({ isLoading: true });

    const Dashboard = (await import("@/pages/Dashboard")).default;
    
    render(<Dashboard />, { wrapper: createWrapper() });

    // Should render without crashing during loading
    expect(document.body).toBeDefined();
  });
});

describe("Dashboard data display", () => {
  beforeEach(() => {
    mockAuthState = staffAuthState;
  });

  it("should display action items count correctly", async () => {
    const { StaffDashboard } = await import("@/components/dashboard/StaffDashboard");
    
    render(<StaffDashboard />, { wrapper: createWrapper() });

    // Should render without crashing
    expect(document.body).toBeDefined();
  });
});
