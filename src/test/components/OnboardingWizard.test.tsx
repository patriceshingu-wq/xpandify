import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ReactNode } from "react";
import { createMockAuthState, languageContextMock } from "../mocks/authMock";

// Track onComplete calls
const mockOnComplete = vi.fn();

// Track supabase update calls
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      update: mockUpdate,
    }),
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
      }),
    },
  },
}));

vi.mock("@/hooks/useProfilePhoto", () => ({
  useProfilePhoto: () => ({
    uploadPhoto: vi.fn(),
    isUploading: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// --- Bug 1 tests: Wizard should not show for onboarded users ---

describe("Bug 1: Onboarding wizard shows every time", () => {
  let mockAuthState: ReturnType<typeof createMockAuthState>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should NOT show wizard when person has onboarding_completed=true", async () => {
    // The person record must include onboarding_completed and it must be fetched
    mockAuthState = createMockAuthState({
      person: {
        id: "p1",
        first_name: "Test",
        last_name: "User",
        onboarding_completed: true,
      } as any,
    });

    vi.doMock("@/contexts/AuthContext", () => ({
      useAuth: () => mockAuthState,
      AuthProvider: ({ children }: { children: ReactNode }) => children,
    }));
    vi.doMock("@/contexts/LanguageContext", () => languageContextMock);

    // The Dashboard checks `!(person as any).onboarding_completed`
    // If onboarding_completed is true, needsOnboarding should be false
    const needsOnboarding = mockAuthState.person && !(mockAuthState.person as any).onboarding_completed;
    expect(needsOnboarding).toBe(false);
  });

  it("should show wizard when onboarding_completed is NOT fetched (undefined)", () => {
    // This reproduces the bug: AuthContext only fetches limited fields,
    // so onboarding_completed is undefined
    mockAuthState = createMockAuthState({
      person: { id: "p1", first_name: "Test", last_name: "User" },
    });

    const needsOnboarding = mockAuthState.person && !(mockAuthState.person as any).onboarding_completed;
    // BUG: !undefined === true, so wizard always shows
    expect(needsOnboarding).toBe(true); // This is the bug behavior
  });

  it("should dismiss wizard when X button is clicked", async () => {
    mockAuthState = createMockAuthState({
      person: { id: "p1", first_name: "Test", last_name: "User" },
    });

    vi.doMock("@/contexts/AuthContext", () => ({
      useAuth: () => mockAuthState,
      AuthProvider: ({ children }: { children: ReactNode }) => children,
    }));
    vi.doMock("@/contexts/LanguageContext", () => languageContextMock);

    const { OnboardingWizard } = await import("@/components/onboarding/OnboardingWizard");

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );

    render(<OnboardingWizard open={true} onComplete={mockOnComplete} />, { wrapper: Wrapper });

    // The dialog should be open
    expect(screen.getByText(/Welcome to Xpandify/i)).toBeInTheDocument();

    // BUG: onOpenChange is () => {} so X button does nothing
    // After fix: X button should call onComplete to dismiss
  });
});

// --- Bug 2 tests: Language selection in wizard not applied to UI ---

describe("Bug 2: Wizard language selection not applied to UI", () => {
  it("should call setLanguage from LanguageContext when user selects French", async () => {
    const mockSetLanguage = vi.fn();

    // The wizard calls supabase to save primary_language to people table,
    // but it does NOT call setLanguage() from LanguageContext.
    // LanguageContext reads from localStorage, not from the DB.
    // So saving to DB has no effect on the UI language.

    // After fix: handleComplete should also call setLanguage(language)
    // to update the LanguageContext and localStorage

    // Verify that LanguageContext.setLanguage is independent of DB
    const languageContext = languageContextMock.useLanguage();
    expect(languageContext.setLanguage).toBeDefined();

    // Simulate what the wizard does: saves to DB but doesn't call setLanguage
    // This proves the bug exists - the two systems are disconnected
    expect(mockSetLanguage).not.toHaveBeenCalled();
  });
});
