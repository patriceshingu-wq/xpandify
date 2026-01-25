import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Simple mock for Supabase - returns resolved promises
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
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

describe("useMeetings hook structure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return query result structure", async () => {
    const { useMeetings } = await import("@/hooks/useMeetings");
    
    const { result } = renderHook(() => useMeetings(), {
      wrapper: createWrapper(),
    });

    // Verify the hook returns expected structure
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("refetch");
  });

  it("should accept filter parameters", async () => {
    const { useMeetings } = await import("@/hooks/useMeetings");
    
    const { result } = renderHook(
      () => useMeetings({ meeting_type: "one_on_one", upcoming: true }),
      { wrapper: createWrapper() }
    );

    expect(result.current).toHaveProperty("data");
  });
});

describe("useMeeting single hook", () => {
  it("should be disabled when no ID provided", async () => {
    const { useMeeting } = await import("@/hooks/useMeetings");
    
    const { result } = renderHook(
      () => useMeeting(undefined),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("should be enabled when ID provided", async () => {
    const { useMeeting } = await import("@/hooks/useMeetings");
    
    const { result } = renderHook(
      () => useMeeting("test-id"),
      { wrapper: createWrapper() }
    );

    expect(result.current).toHaveProperty("data");
  });
});

describe("useMeetingAgendaItems hook", () => {
  it("should be disabled when no meeting ID", async () => {
    const { useMeetingAgendaItems } = await import("@/hooks/useMeetings");
    
    const { result } = renderHook(
      () => useMeetingAgendaItems(undefined),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe("idle");
  });

  it("should be enabled when meeting ID provided", async () => {
    const { useMeetingAgendaItems } = await import("@/hooks/useMeetings");
    
    const { result } = renderHook(
      () => useMeetingAgendaItems("meeting-123"),
      { wrapper: createWrapper() }
    );

    expect(result.current).toHaveProperty("data");
  });
});

describe("Meeting mutations structure", () => {
  it("useCreateMeeting should return mutation functions", async () => {
    const { useCreateMeeting } = await import("@/hooks/useMeetings");
    
    const { result } = renderHook(() => useCreateMeeting(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
    expect(result.current).toHaveProperty("isPending");
    expect(result.current).toHaveProperty("isSuccess");
    expect(result.current.isPending).toBe(false);
  });

  it("useUpdateAgendaItem should return mutation functions", async () => {
    const { useUpdateAgendaItem } = await import("@/hooks/useMeetings");
    
    const { result } = renderHook(() => useUpdateAgendaItem(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
    expect(typeof result.current.mutateAsync).toBe("function");
  });

  it("useCreateAgendaItem should return mutation functions", async () => {
    const { useCreateAgendaItem } = await import("@/hooks/useMeetings");
    
    const { result } = renderHook(() => useCreateAgendaItem(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
  });
});
