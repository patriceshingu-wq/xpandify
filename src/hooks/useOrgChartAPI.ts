import { useQuery } from '@tanstack/react-query';

// Types for the API responses
export interface OrgPerson {
  id: string;
  title: string;
  personTitle: string;
  personName: string;
  category: 'senior-leadership' | 'executive-leadership' | 'ministry-system' | 'department' | 'program' | 'team';
  language: 'english' | 'french' | 'both';
  status: 'active' | 'vacant' | 'inactive';
  parentId: string | null;
  order: number;
  phone: string | null;
  email: string | null;
  notes: string | null;
  department: string | null;
  ministry: string | null;
  breadcrumb: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OrgTreeNode {
  id: string;
  title: string;
  personTitle: string;
  personName: string;
  category: string;
  language: string;
  status: string;
  order: number;
  children: OrgTreeNode[];
}

export interface OrgMinistry {
  id: string;
  title: string;
  language: string;
  status: string;
  departmentCount: number;
  peopleCount: number;
  departments: {
    id: string;
    title: string;
    status: string;
    peopleCount: number;
  }[];
}

export interface OrgDepartment {
  id: string;
  title: string;
  language: string;
  status: string;
  ministry: string | null;
  people: {
    id: string;
    title: string;
    personTitle: string;
    personName: string;
    status: string;
  }[];
}

export interface OrgStats {
  totalNodes: number;
  totalPeople: number;
  vacantPositions: number;
  byCategory: Record<string, number>;
  byLanguage: Record<string, number>;
  byStatus: Record<string, number>;
  lastUpdated: string;
}

interface OrgPersonDetail extends OrgPerson {
  directReports: OrgPerson[];
}

const ORG_API_BASE = 'https://zdousystfprapsbntppx.supabase.co/functions/v1/org-api';
const STALE_TIME = 5 * 60 * 1000;

async function fetchOrgAPI<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${ORG_API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Org API error: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export function useOrgTree(options?: { root?: string; depth?: number; includeVacant?: boolean }) {
  return useQuery<OrgTreeNode[]>({
    queryKey: ['org-chart', 'tree', options],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (options?.root) params.root = options.root;
      if (options?.depth !== undefined) params.depth = String(options.depth);
      if (options?.includeVacant !== undefined) params.includeVacant = String(options.includeVacant);
      return fetchOrgAPI<OrgTreeNode[]>('/tree', params);
    },
    staleTime: STALE_TIME,
  });
}

export function useOrgPeople(filters?: { language?: string; category?: string; status?: string; search?: string }) {
  return useQuery<OrgPerson[]>({
    queryKey: ['org-chart', 'people', filters],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (filters?.language) params.language = filters.language;
      if (filters?.category) params.category = filters.category;
      if (filters?.status) params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      return fetchOrgAPI<OrgPerson[]>('/people', params);
    },
    staleTime: STALE_TIME,
  });
}

export function useOrgPerson(id: string | undefined) {
  return useQuery<OrgPersonDetail>({
    queryKey: ['org-chart', 'person', id],
    queryFn: () => fetchOrgAPI<OrgPersonDetail>(`/people/${id}`),
    enabled: !!id,
    staleTime: STALE_TIME,
  });
}

export function useOrgMinistries() {
  return useQuery<OrgMinistry[]>({
    queryKey: ['org-chart', 'ministries'],
    queryFn: () => fetchOrgAPI<OrgMinistry[]>('/ministries'),
    staleTime: STALE_TIME,
  });
}

export function useOrgDepartments() {
  return useQuery<OrgDepartment[]>({
    queryKey: ['org-chart', 'departments'],
    queryFn: () => fetchOrgAPI<OrgDepartment[]>('/departments'),
    staleTime: STALE_TIME,
  });
}

export function useOrgStats() {
  return useQuery<OrgStats>({
    queryKey: ['org-chart', 'stats'],
    queryFn: () => fetchOrgAPI<OrgStats>('/stats'),
    staleTime: STALE_TIME,
  });
}

export function useOrgSearch(query: string) {
  return useQuery<OrgPerson[]>({
    queryKey: ['org-chart', 'search', query],
    queryFn: () => fetchOrgAPI<OrgPerson[]>('/search', { q: query }),
    enabled: query.length > 0,
    staleTime: STALE_TIME,
  });
}
