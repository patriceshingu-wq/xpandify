import { vi } from "vitest";

// Common hook mock factories

export const createDirectReportsMock = (data: any[] = [], isLoading = false) => ({
  useDirectReports: () => ({ data, isLoading }),
  useDirectReportsWithStats: () => ({ 
    data: data.map(d => ({ ...d, stats: { openActionItems: 0, lastMeetingDate: null } })), 
    isLoading 
  }),
});

export const createMeetingsMock = (meetings: any[] = [], isLoading = false) => ({
  useMeetings: () => ({ data: meetings, isLoading }),
  useMeeting: (id: string | undefined) => ({
    data: id ? meetings.find(m => m.id === id) || null : null,
    isLoading,
  }),
  useMeetingAgendaItems: () => ({ data: [], isLoading }),
  useCreateMeeting: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: "new-meeting" }),
    isPending: false,
  }),
  useUpdateMeeting: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useCreateAgendaItem: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: "new-item" }),
    isPending: false,
  }),
  useUpdateAgendaItem: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
});

export const createGoalsMock = (goals: any[] = [], isLoading = false) => ({
  useGoals: () => ({ data: goals, isLoading }),
  useGoal: (id: string | undefined) => ({
    data: id ? goals.find(g => g.id === id) || null : null,
    isLoading,
  }),
  useUpdateGoal: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
});

export const createPeopleMock = (people: any[] = [], isLoading = false) => ({
  usePeople: () => ({ data: people, isLoading }),
});

export const createDevelopmentPlansMock = (plans: any[] = [], isLoading = false) => ({
  useDevelopmentPlans: () => ({ data: plans, isLoading }),
  useDevelopmentPlan: () => ({ data: null, isLoading }),
});

export const createUserActionItemsMock = (items: any[] = [], isLoading = false) => ({
  useUserActionItems: () => ({ data: items, isLoading }),
});

export const createMeetingTemplatesMock = (templates: any[] = [], isLoading = false) => ({
  useMeetingTemplates: () => ({ data: templates, isLoading }),
  useDeleteMeetingTemplate: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  getSectionTypeLabel: (type: string) => type,
  getSectionTypeColor: () => "bg-gray-100 text-gray-800",
});

export const createMeetingParticipantsMock = (participants: any[] = [], isLoading = false) => ({
  useMeetingParticipants: () => ({ data: participants, isLoading }),
  useBulkAddMeetingParticipants: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
});

export const createNotificationsMock = (notifications: any[] = [], unreadCount = 0) => ({
  useNotifications: () => ({ 
    data: notifications, 
    isLoading: false,
    unreadCount,
  }),
  useMarkNotificationRead: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
});
