import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

// Counts of unlinked rows used by the UnlinkedBanner.
export function useUnlinkedCounts() {
  return useQuery({
    queryKey: ['orgchart-sync', 'unlinked-counts'],
    queryFn: async () => {
      const [ministries, people] = await Promise.all([
        supabase
          .from('ministries')
          .select('id', { count: 'exact', head: true })
          .is('orgchart_id', null)
          .is('deleted_at', null),
        supabase
          .from('people')
          .select('id', { count: 'exact', head: true })
          .is('orgchart_id', null)
          .is('deleted_at', null),
      ]);

      if (ministries.error) throw ministries.error;
      if (people.error) throw people.error;

      return {
        ministries: ministries.count ?? 0,
        people: people.count ?? 0,
      };
    },
  });
}

export interface UnlinkedMinistry {
  id: string;
  name_en: string;
  name_fr: string | null;
}

export function useUnlinkedMinistries() {
  return useQuery({
    queryKey: ['orgchart-sync', 'unlinked-ministries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministries')
        .select('id, name_en, name_fr')
        .is('orgchart_id', null)
        .is('deleted_at', null)
        .order('name_en', { ascending: true });

      if (error) throw error;
      return (data ?? []) as UnlinkedMinistry[];
    },
  });
}

export interface UnlinkedPerson {
  id: string;
  first_name: string;
  last_name: string;
}

const PEOPLE_PAGE_SIZE = 25;

export function useUnlinkedPeople(page: number, search: string) {
  return useQuery({
    queryKey: ['orgchart-sync', 'unlinked-people', page, search],
    queryFn: async () => {
      const from = page * PEOPLE_PAGE_SIZE;
      const to = from + PEOPLE_PAGE_SIZE - 1;

      let query = supabase
        .from('people')
        .select('id, first_name, last_name', { count: 'exact' })
        .is('orgchart_id', null)
        .is('deleted_at', null)
        .order('last_name', { ascending: true })
        .range(from, to);

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        items: (data ?? []) as UnlinkedPerson[],
        totalCount: count ?? 0,
        pageSize: PEOPLE_PAGE_SIZE,
      };
    },
  });
}

// Batch write orgchart_id values. Each entry: { id, orgchart_id }.
export function useApplyMinistryBackfill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (assignments: { id: string; orgchart_id: string }[]) => {
      // Sequential to surface unique-constraint violations row-by-row.
      const results: { id: string; ok: boolean; error?: string }[] = [];
      for (const a of assignments) {
        const { error } = await supabase
          .from('ministries')
          .update({ orgchart_id: a.orgchart_id })
          .eq('id', a.id);
        if (error) {
          results.push({ id: a.id, ok: false, error: error.message });
        } else {
          results.push({ id: a.id, ok: true });
        }
      }
      const failures = results.filter((r) => !r.ok);
      if (failures.length > 0) {
        throw new Error(
          `${failures.length} of ${results.length} ministries could not be linked. First error: ${failures[0].error}`,
        );
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['orgchart-sync'] });
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      toast({
        title: t('common.success'),
        description: `${results.length} ministries linked.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useApplyPeopleBackfill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (assignments: { id: string; orgchart_id: string }[]) => {
      const results: { id: string; ok: boolean; error?: string }[] = [];
      for (const a of assignments) {
        const { error } = await supabase
          .from('people')
          .update({ orgchart_id: a.orgchart_id })
          .eq('id', a.id);
        if (error) {
          results.push({ id: a.id, ok: false, error: error.message });
        } else {
          results.push({ id: a.id, ok: true });
        }
      }
      const failures = results.filter((r) => !r.ok);
      if (failures.length > 0) {
        throw new Error(
          `${failures.length} of ${results.length} people could not be linked. First error: ${failures[0].error}`,
        );
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['orgchart-sync'] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast({
        title: t('common.success'),
        description: `${results.length} people linked.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Phase 2: sync run + review queue
// ─────────────────────────────────────────────────────────────────────────

export interface OrgchartSyncRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  triggered_by: string;
  status: 'running' | 'succeeded' | 'failed';
  summary: {
    auto_applied: number;
    queued_for_review: number;
    errors: number;
    ministries_seen: number;
    people_seen: number;
  } | null;
  error_message: string | null;
}

export function useLastSyncRun() {
  return useQuery({
    queryKey: ['orgchart-sync', 'last-run'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orgchart_sync_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as OrgchartSyncRun | null;
    },
    refetchInterval: (q) => {
      // Poll while a run is in progress so the UI updates without a manual refresh.
      const last = q.state.data as OrgchartSyncRun | null;
      return last?.status === 'running' ? 3000 : false;
    },
  });
}

export interface ReviewQueueItem {
  id: string;
  sync_run_id: string;
  change_type: 'ministry_deleted' | 'person_deleted' | 'ministry_reparented' | 'membership_dropped';
  entity_type: 'ministry' | 'person' | 'people_ministries';
  entity_id: string;
  orgchart_id: string | null;
  before: Record<string, unknown>;
  after: Record<string, unknown> | null;
  state: 'pending' | 'applied' | 'dismissed' | 'snoozed';
  resolved_at: string | null;
  resolved_by: string | null;
  detected_at: string;
}

export function useReviewQueue(includeSnoozed = false) {
  return useQuery({
    queryKey: ['orgchart-sync', 'review-queue', includeSnoozed],
    queryFn: async () => {
      let q = supabase
        .from('orgchart_sync_review_queue')
        .select('*')
        .order('detected_at', { ascending: false });
      q = includeSnoozed ? q.in('state', ['pending', 'snoozed']) : q.eq('state', 'pending');
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ReviewQueueItem[];
    },
  });
}

export function useRunOrgchartSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('orgchart-sync', { body: {} });
      if (error) throw error;
      return data as { run_id: string; summary: OrgchartSyncRun['summary'] };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orgchart-sync'] });
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      const s = data?.summary;
      toast({
        title: t('common.success'),
        description: s
          ? `${s.auto_applied} auto-applied, ${s.queued_for_review} need review${s.errors ? `, ${s.errors} error(s)` : ''}.`
          : 'Sync complete.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Apply a queued change locally. Different change_types take different actions.
export function useResolveReviewItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({
      item,
      action,
    }: {
      item: ReviewQueueItem;
      action: 'apply' | 'dismiss' | 'snooze';
    }) => {
      const nowIso = new Date().toISOString();
      const { data: authData } = await supabase.auth.getUser();
      const resolvedBy = authData.user?.id ?? null;

      if (action === 'apply') {
        if (item.change_type === 'ministry_deleted') {
          const { error } = await supabase
            .from('ministries')
            .update({ deleted_at: nowIso, updated_at: nowIso })
            .eq('id', item.entity_id);
          if (error) throw error;
        } else if (item.change_type === 'person_deleted') {
          const { error } = await supabase
            .from('people')
            .update({ deleted_at: nowIso, updated_at: nowIso })
            .eq('id', item.entity_id);
          if (error) throw error;
        } else if (item.change_type === 'ministry_reparented') {
          const after = item.after as { parent_ministry_id?: string | null } | null;
          const { error } = await supabase
            .from('ministries')
            .update({ parent_ministry_id: after?.parent_ministry_id ?? null, updated_at: nowIso })
            .eq('id', item.entity_id);
          if (error) throw error;
        } else if (item.change_type === 'membership_dropped') {
          const { error } = await supabase
            .from('people_ministries')
            .delete()
            .eq('id', item.entity_id);
          if (error) throw error;
        }
      }

      const newState =
        action === 'apply' ? 'applied' : action === 'dismiss' ? 'dismissed' : 'snoozed';
      const { error: updErr } = await supabase
        .from('orgchart_sync_review_queue')
        .update({ state: newState, resolved_at: nowIso, resolved_by: resolvedBy })
        .eq('id', item.id);
      if (updErr) throw updErr;
      return { id: item.id, state: newState };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgchart-sync'] });
      queryClient.invalidateQueries({ queryKey: ['ministries'] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast({ title: t('common.success') });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}
