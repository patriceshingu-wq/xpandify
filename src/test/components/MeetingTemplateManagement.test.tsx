import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// Mock template data
const mockTemplates = [
  {
    id: "template-1",
    name_en: "1:1 Meeting Template",
    name_fr: "Modèle de réunion 1:1",
    description_en: "Standard 1:1 template",
    meeting_type: "one_on_one",
    is_active: true,
    is_default: true,
    items: [
      {
        id: "item-1",
        template_id: "template-1",
        topic_en: "Spiritual Check-in",
        section_type: "spiritual_life",
        order_index: 0,
        is_required: true,
      },
      {
        id: "item-2",
        template_id: "template-1",
        topic_en: "Goal Review",
        section_type: "goals_review",
        order_index: 1,
        is_required: false,
      },
    ],
  },
  {
    id: "template-2",
    name_en: "Team Meeting",
    meeting_type: "team",
    is_active: false,
    is_default: false,
    items: [],
  },
];

vi.mock("@/hooks/useMeetingTemplates", async () => {
  const actual = await vi.importActual("@/hooks/useMeetingTemplates");
  return {
    ...actual,
    useMeetingTemplates: () => ({
      data: mockTemplates,
      isLoading: false,
    }),
    useDeleteMeetingTemplate: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useCreateMeetingTemplate: () => ({
      mutateAsync: vi.fn(() => Promise.resolve({ id: "new-template" })),
      isPending: false,
    }),
    useUpdateMeetingTemplate: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useCreateTemplateItem: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useUpdateTemplateItem: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useDeleteTemplateItem: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
  };
});

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    getLocalizedField: (obj: any, field: string) => obj?.[`${field}_en`] || "",
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    person: { id: "person-1" },
    isAdminOrSuper: true,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("MeetingTemplateManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render template list", async () => {
    const { MeetingTemplateManagement } = await import(
      "@/components/admin/MeetingTemplateManagement"
    );

    render(<MeetingTemplateManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("1:1 Meeting Template")).toBeInTheDocument();
    });
  });

  it("should show meeting type badges", async () => {
    const { MeetingTemplateManagement } = await import(
      "@/components/admin/MeetingTemplateManagement"
    );

    render(<MeetingTemplateManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("1:1 Meeting")).toBeInTheDocument();
    });
  });

  it("should show default badge for default template", async () => {
    const { MeetingTemplateManagement } = await import(
      "@/components/admin/MeetingTemplateManagement"
    );

    render(<MeetingTemplateManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Default")).toBeInTheDocument();
    });
  });

  it("should show inactive badge for inactive templates", async () => {
    const { MeetingTemplateManagement } = await import(
      "@/components/admin/MeetingTemplateManagement"
    );

    render(<MeetingTemplateManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });
  });

  it("should display template items as badges", async () => {
    const { MeetingTemplateManagement } = await import(
      "@/components/admin/MeetingTemplateManagement"
    );

    render(<MeetingTemplateManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Spiritual Check-in")).toBeInTheDocument();
    });

    expect(screen.getByText("Goal Review")).toBeInTheDocument();
  });

  it("should have New Template button", async () => {
    const { MeetingTemplateManagement } = await import(
      "@/components/admin/MeetingTemplateManagement"
    );

    render(<MeetingTemplateManagement />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("New Template")).toBeInTheDocument();
    });
  });

  it("should open form dialog when clicking New Template", async () => {
    const { MeetingTemplateManagement } = await import(
      "@/components/admin/MeetingTemplateManagement"
    );

    render(<MeetingTemplateManagement />, { wrapper: createWrapper() });

    const newButton = await screen.findByText("New Template");
    fireEvent.click(newButton);

    await waitFor(() => {
      expect(screen.getByText("Create Meeting Template")).toBeInTheDocument();
    });
  });
});
