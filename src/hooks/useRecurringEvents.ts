import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateOccurrences, type RecurrenceRule } from '@/lib/recurrence';
import type { EditScope } from '@/components/calendar/EditScopeDialog';

// Helper to query tables not yet in generated types
const fromAny = (table: string) => supabase.from(table as any);

export function useRecurrenceRule(ruleId: string | undefined | null) {
  return useQuery({
    queryKey: ['recurrence-rule', ruleId],
    queryFn: async () => {
      if (!ruleId) return null;
      const { data, error } = await fromAny('event_recurrence_rules')
        .select('*')
        .eq('id', ruleId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as (RecurrenceRule & { id: string }) | null;
    },
    enabled: !!ruleId,
  });
}

export function useRecurrenceExceptions(seriesId: string | undefined | null) {
  return useQuery({
    queryKey: ['recurrence-exceptions', seriesId],
    queryFn: async () => {
      if (!seriesId) return [];
      const { data, error } = await fromAny('event_recurrence_exceptions')
        .select('*')
        .eq('recurring_series_id', seriesId);
      if (error) throw error;
      return (data || []) as unknown as { id: string; recurring_series_id: string; exception_date: string }[];
    },
    enabled: !!seriesId,
  });
}

export function useCreateRecurringEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({
      eventData,
      rule,
    }: {
      eventData: Record<string, any>;
      rule: RecurrenceRule;
    }) => {
      // 1. Create the recurrence rule
      const { data: ruleData, error: ruleError } = await fromAny('event_recurrence_rules')
        .insert({
          frequency: rule.frequency,
          interval_value: rule.interval_value,
          days_of_week: rule.days_of_week || null,
          day_of_month: rule.day_of_month || null,
          nth_weekday: rule.nth_weekday ?? null,
          weekday_of_month: rule.weekday_of_month ?? null,
          end_type: rule.end_type,
          end_count: rule.end_count || null,
          end_date: rule.end_date || null,
        })
        .select()
        .single();

      if (ruleError) throw ruleError;
      const ruleId = (ruleData as any).id;

      // 2. Generate occurrence dates
      const dates = generateOccurrences(eventData.date, rule);
      if (dates.length === 0) throw new Error('No occurrences generated');

      // 3. Generate a series ID
      const seriesId = crypto.randomUUID();

      // 4. Build all event rows
      const events = dates.map((date) => ({
        ...eventData,
        date,
        end_date: eventData.end_date === eventData.date ? date : eventData.end_date,
        recurring_series_id: seriesId,
        recurrence_rule_id: ruleId,
        is_recurrence_exception: false,
        original_date: date,
        recurrence_pattern: null,
      }));

      // 5. Batch insert (cast to any to handle new columns)
      const { data, error } = await (supabase.from('events') as any)
        .insert(events)
        .select();

      if (error) throw error;
      return { events: data, seriesId, ruleId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: t('common.success'), description: 'Recurring events created' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateRecurringEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({
      eventId,
      eventData,
      scope,
      seriesId,
      ruleId,
    }: {
      eventId: string;
      eventData: Record<string, any>;
      scope: EditScope;
      seriesId: string;
      ruleId: string | null;
    }) => {
      // Strip relation objects
      const { quarter, program, ministry, activity_category, course, ...cleanData } = eventData;

      if (scope === 'this_only') {
        const { error } = await (supabase.from('events') as any)
          .update({ ...cleanData, is_recurrence_exception: true })
          .eq('id', eventId);
        if (error) throw error;
      } else if (scope === 'this_and_future') {
        // Get the current event date
        const { data: currentEvent, error: fetchError } = await supabase
          .from('events')
          .select('date')
          .eq('id', eventId)
          .single();
        if (fetchError) throw fetchError;

        // Delete future non-exception events in the series
        const { error: deleteError } = await (supabase.from('events') as any)
          .delete()
          .eq('recurring_series_id', seriesId)
          .gte('date', currentEvent.date)
          .eq('is_recurrence_exception', false);
        if (deleteError) throw deleteError;

        // Regenerate from this date forward if we have a rule
        if (ruleId) {
          const { data: ruleData } = await fromAny('event_recurrence_rules')
            .select('*')
            .eq('id', ruleId)
            .single();

          if (ruleData) {
            const { data: exceptions } = await fromAny('event_recurrence_exceptions')
              .select('exception_date')
              .eq('recurring_series_id', seriesId);

            const exceptionDates = ((exceptions || []) as any[]).map((e) => e.exception_date);
            const rule = ruleData as unknown as RecurrenceRule;
            const dates = generateOccurrences(currentEvent.date, rule, exceptionDates);

            if (dates.length > 0) {
              const newEvents = dates.map((date) => ({
                ...cleanData,
                date,
                end_date: cleanData.end_date === cleanData.date ? date : cleanData.end_date,
                recurring_series_id: seriesId,
                recurrence_rule_id: ruleId,
                is_recurrence_exception: false,
                original_date: date,
              }));

              const { error: insertError } = await (supabase.from('events') as any)
                .insert(newEvents);
              if (insertError) throw insertError;
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      toast({ title: t('common.success'), description: 'Event(s) updated' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteRecurringEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({
      eventId,
      scope,
      seriesId,
      eventDate,
    }: {
      eventId: string;
      scope: EditScope;
      seriesId: string;
      eventDate: string;
    }) => {
      if (scope === 'this_only') {
        const { error: deleteError } = await supabase
          .from('events')
          .delete()
          .eq('id', eventId);
        if (deleteError) throw deleteError;

        // Add exception to prevent regeneration
        await fromAny('event_recurrence_exceptions')
          .insert({ recurring_series_id: seriesId, exception_date: eventDate });
      } else if (scope === 'this_and_future') {
        const { error } = await (supabase.from('events') as any)
          .delete()
          .eq('recurring_series_id', seriesId)
          .gte('date', eventDate);
        if (error) throw error;
      } else if (scope === 'all_in_series') {
        const { error: eventsError } = await (supabase.from('events') as any)
          .delete()
          .eq('recurring_series_id', seriesId);
        if (eventsError) throw eventsError;

        // Clean up exceptions
        await fromAny('event_recurrence_exceptions')
          .delete()
          .eq('recurring_series_id', seriesId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: t('common.success'), description: 'Event(s) deleted' });
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });
}
