import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDirectReportsWithStats } from '@/hooks/useDirectReports';
import { useMeetingTemplates } from '@/hooks/useMeetingTemplates';
import { useCreateMeeting, useCreateAgendaItem } from '@/hooks/useMeetings';
import { useBulkAddMeetingParticipants } from '@/hooks/useMeetingParticipants';
import { fetchVisibleFeedback, formatFeedbackForNotes } from '@/hooks/useVisibleFeedback';
import { DirectReportCard } from './DirectReportCard';
import { QuickScheduleDialog } from './QuickScheduleDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, CalendarPlus, TrendingUp, CheckSquare, Target } from 'lucide-react';
import { toast } from 'sonner';

export function SupervisorDashboard() {
  const { t } = useLanguage();
  const { person } = useAuth();
  const navigate = useNavigate();
  
  const { data: directReports, isLoading } = useDirectReportsWithStats();
  const { data: templates } = useMeetingTemplates();
  const createMeeting = useCreateMeeting();
  const createAgendaItem = useCreateAgendaItem();
  const bulkAddParticipants = useBulkAddMeetingParticipants();

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<{ id: string; name: string } | null>(null);

  // Get default 1:1 template
  const oneOnOneTemplates = templates?.filter(t => t.meeting_type === 'one_on_one') || [];
  const defaultTemplate = oneOnOneTemplates.find(t => t.is_default) || oneOnOneTemplates[0];

  // Calculate aggregate stats
  const totalReports = directReports?.length || 0;
  const reportsWithoutMeeting = directReports?.filter(r => !r.nextMeeting).length || 0;
  const totalOpenActions = directReports?.reduce((sum, r) => sum + r.openActionItems, 0) || 0;
  const totalGoalsInProgress = directReports?.reduce((sum, r) => sum + r.goalsInProgress, 0) || 0;

  const handleSchedule1on1 = (personId: string, personName: string) => {
    setSelectedPerson({ id: personId, name: personName });
    setScheduleDialogOpen(true);
  };

  const handleQuickSchedule = async (data: {
    personId: string;
    dateTime: Date;
    templateId: string | null;
    title: string;
  }) => {
    if (!person?.id) return;

    try {
      // Create the meeting
      const newMeeting = await createMeeting.mutateAsync({
        meeting_type: 'one_on_one',
        title_en: data.title,
        title_fr: `1:1 avec ${selectedPerson?.name}`,
        date_time: data.dateTime.toISOString(),
        duration_minutes: 60,
        organizer_id: person.id,
        person_focus_id: data.personId,
        spiritual_focus: true,
      });

      // Add person as participant
      await bulkAddParticipants.mutateAsync({
        meeting_id: newMeeting.id,
        person_ids: [data.personId],
      });

      // Apply template if selected
      let orderIndex = 0;
      if (data.templateId) {
        const template = templates?.find(t => t.id === data.templateId);
        if (template?.items && template.items.length > 0) {
          for (const item of template.items) {
            await createAgendaItem.mutateAsync({
              meeting_id: newMeeting.id,
              topic_en: item.topic_en,
              topic_fr: item.topic_fr,
              section_type: item.section_type as any,
              order_index: item.order_index || orderIndex,
            });
            orderIndex = Math.max(orderIndex, (item.order_index || 0) + 1);
          }
        }
      }

      // Add visible feedback as agenda items
      try {
        const visibleFeedback = await fetchVisibleFeedback(data.personId);
        for (const feedback of visibleFeedback) {
          await createAgendaItem.mutateAsync({
            meeting_id: newMeeting.id,
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

      toast.success('1:1 scheduled successfully');
      setScheduleDialogOpen(false);
    } catch (error) {
      console.error('Error scheduling 1:1:', error);
      toast.error('Failed to schedule 1:1');
    }
  };

  const handleViewProfile = (personId: string) => {
    navigate(`/people?view=${personId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!directReports || directReports.length === 0) {
    return null; // Don't show this section if user has no direct reports
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">My Team</h2>
          <span className="text-sm text-muted-foreground">
            ({totalReports} direct report{totalReports !== 1 ? 's' : ''})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/meetings')}
        >
          <CalendarPlus className="h-4 w-4 mr-2" />
          View All Meetings
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalReports}</p>
                <p className="text-xs text-muted-foreground">Direct Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${reportsWithoutMeeting > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
                <CalendarPlus className={`h-4 w-4 ${reportsWithoutMeeting > 0 ? 'text-warning' : 'text-success'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{reportsWithoutMeeting}</p>
                <p className="text-xs text-muted-foreground">Need 1:1 Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${totalOpenActions > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
                <CheckSquare className={`h-4 w-4 ${totalOpenActions > 0 ? 'text-warning' : 'text-success'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOpenActions}</p>
                <p className="text-xs text-muted-foreground">Open Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Target className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalGoalsInProgress}</p>
                <p className="text-xs text-muted-foreground">Goals In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Direct Reports List */}
      <div className="grid gap-4">
        {directReports.map((report) => (
          <DirectReportCard
            key={report.id}
            report={report}
            onSchedule1on1={handleSchedule1on1}
            onViewProfile={handleViewProfile}
          />
        ))}
      </div>

      {/* Quick Schedule Dialog */}
      <QuickScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        personId={selectedPerson?.id || ''}
        personName={selectedPerson?.name || ''}
        organizerId={person?.id || ''}
        templates={oneOnOneTemplates}
        defaultTemplateId={defaultTemplate?.id}
        onSchedule={handleQuickSchedule}
        isLoading={createMeeting.isPending}
      />
    </div>
  );
}
