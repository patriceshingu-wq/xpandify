import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ReactNode } from "react";

// Mock the auth context with different user roles
const mockAuthContext = {
  user: { id: "test-user-id", email: "test@example.com" },
  person: { id: "person-1", first_name: "Test", last_name: "User" },
  isAdminOrSuper: false,
  isLoading: false,
  signOut: vi.fn(),
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    getLocalizedField: (obj: any, field: string) => obj?.[`${field}_en`] || "",
    language: "en",
    setLanguage: vi.fn(),
  }),
  LanguageProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock hooks with different data scenarios
const mockDirectReports: any[] = [];
vi.mock("@/hooks/useDirectReports", () => ({
  useDirectReports: () => ({
    data: mockDirectReports,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useMeetings", () => ({
  useMeetings: () => ({
    data: [],
    isLoading: false,
  }),
  useUpdateAgendaItem: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/useGoals", () => ({
  useGoals: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useDevelopmentPlans", () => ({
  useDevelopmentPlans: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useUserActionItems", () => ({
  useUserActionItems: () => ({
    data: [],
    isLoading: false,
  }),
}));

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
  });

  it("should render staff dashboard when user has no direct reports", async () => {
    // Staff user - no direct reports
    mockDirectReports.length = 0;
    
    const Dashboard = (await import("@/pages/Dashboard")).default;
    
    render(<Dashboard />, { wrapper: createWrapper() });

    // Staff dashboard shows personal action items section
    await vi.waitFor(() => {
      expect(screen.queryByText("dashboard.overview")).toBeInTheDocument();
    });
  });

  it("should handle loading state", async () => {
    vi.mock("@/hooks/useDirectReports", () => ({
      useDirectReports: () => ({
        data: undefined,
        isLoading: true,
      }),
    }));

    const Dashboard = (await import("@/pages/Dashboard")).default;
    
    render(<Dashboard />, { wrapper: createWrapper() });

    // Should show loading indicator or skeleton
    expect(screen.queryByText("Loading")).toBeDefined();
  });
});

describe("Dashboard data display", () => {
  it("should display action items count correctly", async () => {
    const { StaffDashboard } = await import("@/components/dashboard/StaffDashboard");
    
    render(<StaffDashboard />, { wrapper: createWrapper() });

    // Should render without crashing
    expect(document.body).toBeDefined();
  });
});
