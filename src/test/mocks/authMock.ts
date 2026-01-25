import { vi } from "vitest";
import { ReactNode } from "react";

export type MockAuthState = {
  user: { id: string; email: string } | null;
  person: { id: string; first_name: string; last_name: string; preferred_name?: string } | null;
  profile: { id: string; email: string; primary_language: 'en' | 'fr'; is_active: boolean } | null;
  roles: string[];
  isAdminOrSuper: boolean;
  isLoading: boolean;
  signIn: ReturnType<typeof vi.fn>;
  signUp: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  session: null;
};

export const createMockAuthState = (overrides: Partial<MockAuthState> = {}): MockAuthState => {
  const roles = overrides.roles ?? [];
  const isAdminOrSuper = overrides.isAdminOrSuper ?? (roles.includes('super_admin') || roles.includes('admin'));
  
  // Handle explicit null overrides for user and person
  const user = 'user' in overrides ? overrides.user : { id: "test-user-id", email: "test@example.com" };
  const person = 'person' in overrides ? overrides.person : { id: "person-1", first_name: "Test", last_name: "User" };
  const profile = 'profile' in overrides ? overrides.profile : { id: "test-user-id", email: "test@example.com", primary_language: 'en' as const, is_active: true };
  
  return {
    user,
    person,
    profile,
    roles,
    isAdminOrSuper,
    isLoading: overrides.isLoading ?? false,
    signIn: overrides.signIn ?? vi.fn().mockResolvedValue({ error: null }),
    signUp: overrides.signUp ?? vi.fn().mockResolvedValue({ error: null }),
    signOut: overrides.signOut ?? vi.fn().mockResolvedValue(undefined),
    hasRole: overrides.hasRole ?? ((role: string) => roles.includes(role)),
    hasAnyRole: overrides.hasAnyRole ?? ((checkRoles: string[]) => checkRoles.some(r => roles.includes(r))),
    session: null,
  };
};

// Default mock states for common scenarios
export const adminAuthState = createMockAuthState({
  user: { id: "admin-user-id", email: "admin@test.com" },
  person: { id: "admin-person-id", first_name: "Admin", last_name: "User" },
  roles: ["super_admin", "admin"],
  isAdminOrSuper: true,
});

export const staffAuthState = createMockAuthState({
  user: { id: "staff-user-id", email: "staff@test.com" },
  person: { id: "staff-person-id", first_name: "Staff", last_name: "User" },
  roles: ["staff"],
  isAdminOrSuper: false,
});

export const volunteerAuthState = createMockAuthState({
  user: { id: "volunteer-user-id", email: "volunteer@test.com" },
  person: { id: "volunteer-person-id", first_name: "Volunteer", last_name: "User" },
  roles: ["volunteer"],
  isAdminOrSuper: false,
});

export const loadingAuthState = createMockAuthState({
  user: null,
  person: null,
  isLoading: true,
});

export const unauthenticatedState = createMockAuthState({
  user: null,
  person: null,
  isLoading: false,
});

// Factory to create the mock module
export const createAuthContextMock = (authState: MockAuthState) => ({
  useAuth: () => authState,
  AuthProvider: ({ children }: { children: ReactNode }) => children,
});

// Language context mock
export const languageContextMock = {
  useLanguage: () => ({
    t: (key: string) => key,
    getLocalizedField: (obj: any, field: string) => obj?.[`${field}_en`] || obj?.title_en || "",
    language: "en" as const,
    setLanguage: vi.fn(),
  }),
  LanguageProvider: ({ children }: { children: ReactNode }) => children,
};
