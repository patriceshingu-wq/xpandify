import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Simple mock for Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: { id: "test-id" }, error: null }),
    })),
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    getLocalizedField: (obj: any, field: string) => obj?.[`${field}_en`] || "",
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useGoals hook structure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return query result structure", async () => {
    const { useGoals } = await import("@/hooks/useGoals");
    
    const { result } = renderHook(() => useGoals(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("error");
  });

  it("should accept filter parameters", async () => {
    const { useGoals } = await import("@/hooks/useGoals");
    
    const { result } = renderHook(
      () => useGoals({ status: "in_progress", year: 2025 }),
      { wrapper: createWrapper() }
    );

    expect(result.current).toHaveProperty("data");
  });
});

describe("useGoal single hook", () => {
  it("should be disabled when no ID provided", async () => {
    const { useGoal } = await import("@/hooks/useGoals");
    
    const { result } = renderHook(
      () => useGoal(undefined),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("should be enabled when ID provided", async () => {
    const { useGoal } = await import("@/hooks/useGoals");
    
    const { result } = renderHook(
      () => useGoal("goal-123"),
      { wrapper: createWrapper() }
    );

    expect(result.current).toHaveProperty("data");
  });
});

describe("Goal mutations structure", () => {
  it("useCreateGoal should return mutation functions", async () => {
    const { useCreateGoal } = await import("@/hooks/useGoals");
    
    const { result } = renderHook(() => useCreateGoal(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
    expect(result.current).toHaveProperty("isPending");
    expect(result.current).toHaveProperty("isSuccess");
    expect(result.current.isPending).toBe(false);
  });

  it("useUpdateGoal should return mutation functions", async () => {
    const { useUpdateGoal } = await import("@/hooks/useGoals");
    
    const { result } = renderHook(() => useUpdateGoal(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
    expect(typeof result.current.mutateAsync).toBe("function");
  });

  it("useDeleteGoal should return mutation functions", async () => {
    const { useDeleteGoal } = await import("@/hooks/useGoals");
    
    const { result } = renderHook(() => useDeleteGoal(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
    expect(typeof result.current.mutate).toBe("function");
  });
});

describe("Goal filter combinations", () => {
  it("should accept all filter types", async () => {
    const { useGoals } = await import("@/hooks/useGoals");
    
    const { result } = renderHook(
      () => useGoals({
        year: 2025,
        goal_level: "individual",
        status: "in_progress",
        category: "ministry",
        owner_person_id: "person-123",
      }),
      { wrapper: createWrapper() }
    );

    expect(result.current).toHaveProperty("data");
  });
});
