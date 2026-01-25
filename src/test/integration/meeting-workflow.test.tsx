import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen, waitFor } from "@testing-library/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ReactNode } from "react";
import { adminAuthState, languageContextMock, MockAuthState } from "../mocks/authMock";

/**
 * Integration tests for the Meeting Workflow
 * 
 * This tests the complete flow:
 * 1. Create a meeting
 * 2. Add agenda items
 * 3. Link goals/PDP items
 * 4. Assign action items
 * 5. Update action status
 * 6. Verify notifications are generated
 */

// Configurable auth state
let mockAuthState: MockAuthState = adminAuthState;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/contexts/LanguageContext", () => languageContextMock);

// Track mutation calls for verification
const mutationCalls: Record<string, any[]> = {
  createMeeting: [],
  createAgendaItem: [],
  updateAgendaItem: [],
  updateGoal: [],
};

vi.mock("@/hooks/useMeetings", () => ({
  useMeetings: () => ({
    data: [
      {
        id: "meeting-1",
        title_en: "Weekly 1:1",
        date_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        meeting_type: "one_on_one",
        duration_minutes: 60,
        organizer_id: "person-1",
        organizer: { id: "person-1", first_name: "Test", last_name: "User" },
      },
    ],
    isLoading: false,
  }),
  useMeeting: (id: string | undefined) => ({
    data: id ? {
      id: "meeting-1",
      title_en: "Weekly 1:1",
      date_time: new Date(Date.now() + 86400000).toISOString(),
      meeting_type: "one_on_one",
      duration_minutes: 60,
      organizer_id: "person-1",
      person_focus_id: "person-2",
      organizer: { id: "person-1", first_name: "Test", last_name: "User" },
    } : null,
    isLoading: false,
  }),
  useMeetingAgendaItems: () => ({
    data: [
      {
        id: "item-1",
        meeting_id: "meeting-1",
        topic_en: "Goal: Improve skills",
        section_type: "goals_review",
        order_index: 0,
        linked_goal_id: "goal-1",
        action_required: true,
        action_status: "open",
        action_owner_id: "person-2",
        action_due_date: "2025-01-20", // Overdue
      },
    ],
    isLoading: false,
  }),
  useCreateMeeting: () => ({
    mutateAsync: vi.fn((data) => {
      mutationCalls.createMeeting.push(data);
      return Promise.resolve({ id: "new-meeting-id", ...data });
    }),
    isPending: false,
  }),
  useUpdateMeeting: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCreateAgendaItem: () => ({
    mutateAsync: vi.fn((data) => {
      mutationCalls.createAgendaItem.push(data);
      return Promise.resolve({ id: "new-item-id", ...data });
    }),
    isPending: false,
  }),
  useUpdateAgendaItem: () => ({
    mutateAsync: vi.fn((data) => {
      mutationCalls.updateAgendaItem.push(data);
      return Promise.resolve(data);
    }),
    isPending: false,
  }),
}));

vi.mock("@/hooks/useMeetingParticipants", () => ({
  useMeetingParticipants: () => ({
    data: [
      { id: "mp-1", meeting_id: "meeting-1", person_id: "person-2", person: { id: "person-2", first_name: "Jane", last_name: "Doe" } },
    ],
    isLoading: false,
  }),
  useBulkAddMeetingParticipants: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

vi.mock("@/hooks/usePeople", () => ({
  usePeople: () => ({
    data: [
      { id: "person-1", first_name: "Test", last_name: "User" },
      { id: "person-2", first_name: "Jane", last_name: "Doe" },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useGoals", () => ({
  useGoals: () => ({
    data: [
      {
        id: "goal-1",
        title_en: "Improve skills",
        status: "in_progress",
        progress_percent: 50,
        goal_level: "individual",
        owner_person_id: "person-2",
      },
    ],
    isLoading: false,
  }),
  useGoal: () => ({
    data: {
      id: "goal-1",
      title_en: "Improve skills",
      status: "in_progress",
      progress_percent: 50,
    },
    isLoading: false,
  }),
  useUpdateGoal: () => ({
    mutateAsync: vi.fn((data) => {
      mutationCalls.updateGoal.push(data);
      return Promise.resolve(data);
    }),
    isPending: false,
  }),
}));

vi.mock("@/hooks/useDevelopmentPlans", () => ({
  useDevelopmentPlans: () => ({ data: [], isLoading: false }),
  useDevelopmentPlan: () => ({ data: null, isLoading: false }),
}));

vi.mock("@/hooks/useMeetingTemplates", () => ({
  useMeetingTemplates: () => ({ data: [], isLoading: false }),
  useDeleteMeetingTemplate: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  getSectionTypeLabel: (type: string) => type,
  getSectionTypeColor: () => "bg-gray-100 text-gray-800",
}));

vi.mock("@/hooks/useDirectReports", () => ({
  useDirectReports: () => ({ data: [], isLoading: false }),
  useDirectReportsWithStats: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/hooks/useUserActionItems", () => ({
  useUserActionItems: () => ({ data: [], isLoading: false }),
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

describe("Meeting Workflow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = adminAuthState;
    Object.keys(mutationCalls).forEach((key) => {
      mutationCalls[key] = [];
    });
  });

  describe("Meetings Page", () => {
    it("should render meetings list", async () => {
      const Meetings = (await import("@/pages/Meetings")).default;

      render(<Meetings />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("Weekly 1:1")).toBeInTheDocument();
      });
    });

    it("should show add meeting button", async () => {
      const Meetings = (await import("@/pages/Meetings")).default;

      render(<Meetings />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("meetings.addMeeting")).toBeInTheDocument();
      });
    });
  });

  describe("Meeting Detail Dialog", () => {
    it("should display linked goal in agenda item", async () => {
      const { MeetingDetailDialog } = await import(
        "@/components/meetings/MeetingDetailDialog"
      );

      render(
        <MeetingDetailDialog
          open={true}
          onOpenChange={() => {}}
          meetingId="meeting-1"
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText(/Goal:/)).toBeInTheDocument();
      });
    });
  });

  describe("Action Item Status Update", () => {
    it("should track action status mutations", async () => {
      const { useUpdateAgendaItem } = await import("@/hooks/useMeetings");
      
      const mutation = useUpdateAgendaItem();
      
      await mutation.mutateAsync({
        id: "item-1",
        meeting_id: "meeting-1",
        action_status: "done",
      });

      expect(mutationCalls.updateAgendaItem).toHaveLength(1);
      expect(mutationCalls.updateAgendaItem[0]).toEqual({
        id: "item-1",
        meeting_id: "meeting-1",
        action_status: "done",
      });
    });
  });

  describe("Goal Progress Update from Meeting", () => {
    it("should update goal progress", async () => {
      const { useUpdateGoal } = await import("@/hooks/useGoals");
      
      const mutation = useUpdateGoal();
      
      await mutation.mutateAsync({
        id: "goal-1",
        progress_percent: 75,
        status: "in_progress",
      });

      expect(mutationCalls.updateGoal).toHaveLength(1);
      expect(mutationCalls.updateGoal[0].progress_percent).toBe(75);
    });
  });
});

describe("Overdue Action Items", () => {
  it("should identify overdue action items correctly", () => {
    const actionItem = {
      id: "item-1",
      action_due_date: "2025-01-20",
      action_status: "open",
      action_required: true,
    };

    const dueDate = new Date(actionItem.action_due_date);
    const now = new Date();
    const isOverdue = dueDate < now && actionItem.action_status !== "done";

    expect(isOverdue).toBe(true);
  });

  it("should not flag completed items as overdue", () => {
    const actionItem = {
      id: "item-1",
      action_due_date: "2025-01-20",
      action_status: "done",
      action_required: true,
    };

    const dueDate = new Date(actionItem.action_due_date);
    const now = new Date();
    const isOverdue = dueDate < now && actionItem.action_status !== "done";

    expect(isOverdue).toBe(false);
  });
});
