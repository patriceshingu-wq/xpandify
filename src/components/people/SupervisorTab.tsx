import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupervisor } from '@/hooks/useSupervisor';
import { useMeetingTemplates } from '@/hooks/useMeetingTemplates';
import { useCreateMeeting, useCreateAgendaItem } from '@/hooks/useMeetings';
import { useBulkAddMeetingParticipants } from '@/hooks/useMeetingParticipants';
import { fetchVisibleFeedback, formatFeedbackForNotes } from '@/hooks/useVisibleFeedback';
import { EmptyState } from '@/components/ui/empty-state';
import { CardSkeleton } from '@/components/ui/mobile-skeletons';
import { Crown } from 'lucide-react';
import { SupervisorCard } from '@/components/team/SupervisorCard';
import { QuickScheduleDialog } from '@/components/dashboard/QuickScheduleDialog';

export function SupervisorTab() {
  const { person } = useAuth();
  const { data: supervisor, isLoading } = useSupervisor();
  const { data: templates } = useMeetingTemplates();
  const createMeeting = useCreateMeeting();
  const createAgendaItem = useCreateAgendaItem();
  const bulkAddParticipants = useBulkAddMeetingParticipants();
  const [scheduleForSupervisor, setScheduleForSupervisor] = useState(false);

  const oneOnOneTemplates = templates?.filter(t => t.meeting_type === 'one_on_one') || [];
  const defaultTemplate = oneOnOneTemplates.find(t => t.is_default);

  const handleSchedule = async (data: { title: string; dateTime: Date; personId: string; templateId?: string }) => {
    if (!person) return;

    const meeting = await createMeeting.mutateAsync({
      meeting_type: 'one_on_one',
      title_en: data.title,
      date_time: data.dateTime.toISOString(),
      duration_minutes: 60,
      organizer_id: person.id,
      person_focus_id: data.personId,
    });

    await bulkAddParticipants.mutateAsync({
      meeting_id: meeting.id,
      person_ids: [data.personId],
    });

    let orderIndex = 0;
    if (data.templateId) {
      const template = templates?.find(t => t.id === data.templateId);
      if (template?.items) {
        for (const item of template.items) {
          await createAgendaItem.mutateAsync({
            meeting_id: meeting.id,
            topic_en: item.topic_en,
            topic_fr: item.topic_fr,
            section_type: item.section_type as any,
            order_index: item.order_index || orderIndex,
          });
          orderIndex = Math.max(orderIndex, (item.order_index || 0) + 1);
        }
      }
    }

    try {
      const visibleFeedback = await fetchVisibleFeedback(data.personId);
      for (const feedback of visibleFeedback) {
        await createAgendaItem.mutateAsync({
          meeting_id: meeting.id,
          topic_en: 'Received Feedback',
          topic_fr: 'Rétroaction reçue',
          section_type: 'feedback_coaching',
          discussion_notes: formatFeedbackForNotes(feedback, 'en'),
          order_index: orderIndex++,
        });
      }
    } catch (error) {
      console.error('Error fetching feedback for agenda:', error);
    }

    setScheduleForSupervisor(false);
  };

  if (isLoading) {
    return <CardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {supervisor ? (
        <SupervisorCard supervisor={supervisor} onScheduleMeeting={() => setScheduleForSupervisor(true)} />
      ) : (
        <EmptyState
          icon={<Crown className="h-16 w-16" />}
          title="No Supervisor Assigned"
          description="You don't have a supervisor assigned in the system yet"
        />
      )}

      {scheduleForSupervisor && supervisor && person && (
        <QuickScheduleDialog
          open={scheduleForSupervisor}
          onOpenChange={(open) => !open && setScheduleForSupervisor(false)}
          personId={supervisor.id}
          personName={`${supervisor.first_name} ${supervisor.last_name}`}
          organizerId={person.id}
          templates={oneOnOneTemplates}
          defaultTemplateId={defaultTemplate?.id}
          onSchedule={handleSchedule}
          isLoading={createMeeting.isPending}
        />
      )}
    </div>
  );
}
