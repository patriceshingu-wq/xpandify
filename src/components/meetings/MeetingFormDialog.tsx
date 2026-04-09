import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Meeting, useCreateMeeting, useUpdateMeeting, useCreateAgendaItem } from '@/hooks/useMeetings';
import { usePeople } from '@/hooks/usePeople';
import { useMinistries } from '@/hooks/useMinistries';
import { useMeetingTemplates, MeetingTemplate } from '@/hooks/useMeetingTemplates';
import { useBulkAddMeetingParticipants } from '@/hooks/useMeetingParticipants';
import { checkMeetingConflicts, formatConflictMessage, MeetingConflict } from '@/hooks/useMeetingConflicts';
import { fetchVisibleFeedback, formatFeedbackForNotes, getFeedbackTitle } from '@/hooks/useVisibleFeedback';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { RescheduleConflictsDialog } from '@/components/meetings/RescheduleConflictsDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { addWeeks, addMonths } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type MeetingType = Database['public']['Enums']['meeting_type'];

interface MeetingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting | null;
}

export function MeetingFormDialog({ open, onOpenChange, meeting }: MeetingFormDialogProps) {
  const { t, getLocalizedField } = useLanguage();
  const { person } = useAuth();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const createAgendaItem = useCreateAgendaItem();
  const bulkAddParticipants = useBulkAddMeetingParticipants();
  const { data: people } = usePeople();
  const { data: ministries } = useMinistries();
  const { data: templates } = useMeetingTemplates();
  const { recurringMeetings: recurringEnabled } = useFeatureFlags();
  const isEditing = !!meeting;

  const [formData, setFormData] = useState({
    meeting_type: 'team' as MeetingType,
    title_en: '',
    title_fr: '',
    date_time: '',
    duration_minutes: 60,
    organizer_id: '',
    ministry_id: '',
    person_focus_id: '',
    spiritual_focus: false,
    recurrence_pattern: '',
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [conflicts, setConflicts] = useState<MeetingConflict[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);

  // Filter templates by meeting type
  const availableTemplates = templates?.filter(t => t.meeting_type === formData.meeting_type) || [];

  // Get direct reports for person_focus selection (for 1:1s)
  const directReports = people?.filter(p => p.supervisor_id === person?.id) || [];

  useEffect(() => {
    if (meeting) {
      setFormData({
        meeting_type: meeting.meeting_type || 'team',
        title_en: meeting.title_en || '',
        title_fr: meeting.title_fr || '',
        date_time: meeting.date_time ? new Date(meeting.date_time).toISOString().slice(0, 16) : '',
        duration_minutes: meeting.duration_minutes || 60,
        organizer_id: meeting.organizer_id || '',
        ministry_id: meeting.ministry_id || '',
        person_focus_id: (meeting as any).person_focus_id || '',
        spiritual_focus: (meeting as any).spiritual_focus || false,
        recurrence_pattern: (meeting as any).recurrence_pattern || '',
      });
      setSelectedTemplateId('');
      setConflicts([]);
    } else {
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      setFormData({
        meeting_type: 'team',
        title_en: '',
        title_fr: '',
        date_time: now.toISOString().slice(0, 16),
        duration_minutes: 60,
        organizer_id: person?.id || '',
        ministry_id: '',
        person_focus_id: '',
        spiritual_focus: false,
        recurrence_pattern: '',
      });
      setSelectedTemplateId('');
      setConflicts([]);
    }
  }, [meeting, open, person]);

  // Check for conflicts when date/time, duration, or participants change
  useEffect(() => {
    const checkConflicts = async () => {
      if (!formData.date_time || !formData.organizer_id) return;

      const personIds = [formData.organizer_id];
      if (formData.person_focus_id) {
        personIds.push(formData.person_focus_id);
      }

      setIsCheckingConflicts(true);
      try {
        const foundConflicts = await checkMeetingConflicts({
          dateTime: new Date(formData.date_time),
          durationMinutes: formData.duration_minutes,
          personIds,
          excludeMeetingId: meeting?.id,
        });
        setConflicts(foundConflicts);
      } catch (error) {
        console.error('Error checking conflicts:', error);
      } finally {
        setIsCheckingConflicts(false);
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(checkConflicts, 300);
    return () => clearTimeout(timeoutId);
  }, [formData.date_time, formData.duration_minutes, formData.organizer_id, formData.person_focus_id, meeting?.id]);

  // Auto-fill title when selecting a person focus for 1:1
  useEffect(() => {
    if (formData.meeting_type === 'one_on_one' && formData.person_focus_id && !isEditing) {
      const focusPerson = people?.find(p => p.id === formData.person_focus_id);
      if (focusPerson && !formData.title_en) {
        setFormData(prev => ({
          ...prev,
          title_en: `1:1 with ${focusPerson.first_name} ${focusPerson.last_name}`,
          title_fr: `1:1 avec ${focusPerson.first_name} ${focusPerson.last_name}`,
        }));
      }
    }
  }, [formData.person_focus_id, formData.meeting_type, isEditing, people, formData.title_en]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Open reschedule dialog if conflicts exist
    if (conflicts.length > 0) {
      setShowRescheduleDialog(true);
      return;
    }
    proceedWithSave();
  };

  const proceedWithSave = async () => {
    const seriesId = formData.recurrence_pattern ? crypto.randomUUID() : null;
    const payload = {
      meeting_type: formData.meeting_type,
      title_en: formData.title_en,
      title_fr: formData.title_fr || null,
      date_time: new Date(formData.date_time).toISOString(),
      duration_minutes: formData.duration_minutes,
      organizer_id: formData.organizer_id,
      ministry_id: formData.ministry_id || null,
      person_focus_id: formData.person_focus_id || null,
      spiritual_focus: formData.spiritual_focus,
      recurrence_pattern: formData.recurrence_pattern || null,
      recurring_series_id: seriesId,
    };

    if (isEditing && meeting) {
      await updateMeeting.mutateAsync({ id: meeting.id, ...payload });
      onOpenChange(false);
    } else {
      // Helper to create agenda + participants for a meeting
      const setupMeeting = async (meetingId: string) => {
        // Add person_focus as participant for 1:1s
        if (formData.meeting_type === 'one_on_one' && formData.person_focus_id) {
          await bulkAddParticipants.mutateAsync({
            meeting_id: meetingId,
            person_ids: [formData.person_focus_id],
          });
        }

        // Apply template if selected
        let templateOrderIndex = 0;
        if (selectedTemplateId && selectedTemplateId !== 'none') {
          const template = templates?.find(t => t.id === selectedTemplateId);
          if (template?.items && template.items.length > 0) {
            for (const item of template.items) {
              await createAgendaItem.mutateAsync({
                meeting_id: meetingId,
                topic_en: item.topic_en,
                topic_fr: item.topic_fr,
                section_type: item.section_type as any,
                order_index: item.order_index || templateOrderIndex,
              });
              templateOrderIndex = Math.max(templateOrderIndex, (item.order_index || 0) + 1);
            }
          }
        }

        // Add visible feedback as agenda items for 1:1 meetings
        if (formData.meeting_type === 'one_on_one' && formData.person_focus_id) {
          try {
            const visibleFeedback = await fetchVisibleFeedback(formData.person_focus_id);
            for (const feedback of visibleFeedback) {
              const { title_en, title_fr } = getFeedbackTitle(feedback);
              await createAgendaItem.mutateAsync({
                meeting_id: meetingId,
                topic_en: title_en,
                topic_fr: title_fr,
                section_type: 'feedback_coaching',
                discussion_notes: formatFeedbackForNotes(feedback, 'en'),
                order_index: templateOrderIndex++,
                linked_feedback_id: feedback.id,
              });
            }
          } catch (error) {
            console.error('Error fetching feedback for agenda:', error);
          }
        }
      };

      // Create the first meeting
      const newMeeting = await createMeeting.mutateAsync(payload);
      await setupMeeting(newMeeting.id);

      // Generate recurring instances
      if (formData.recurrence_pattern && seriesId) {
        const baseDate = new Date(formData.date_time);
        const count = formData.recurrence_pattern === 'monthly' ? 6 : 12;
        
        for (let i = 1; i < count; i++) {
          let nextDate: Date;
          if (formData.recurrence_pattern === 'weekly') {
            nextDate = addWeeks(baseDate, i);
          } else if (formData.recurrence_pattern === 'biweekly') {
            nextDate = addWeeks(baseDate, i * 2);
          } else {
            nextDate = addMonths(baseDate, i);
          }

          const instancePayload = {
            ...payload,
            date_time: nextDate.toISOString(),
            recurring_series_id: seriesId,
          };
          const instance = await createMeeting.mutateAsync(instancePayload);
          await setupMeeting(instance.id);
        }
      }

      onOpenChange(false);
    }
  };

  const handleRescheduled = () => {
    // Re-check conflicts after rescheduling
    setConflicts([]);
  };

  const getPersonIdsForConflictCheck = () => {
    const ids = [formData.organizer_id];
    if (formData.person_focus_id) {
      ids.push(formData.person_focus_id);
    }
    return ids.filter(Boolean);
  };

  const isLoading = createMeeting.isPending || updateMeeting.isPending || createAgendaItem.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {isEditing ? 'Edit Meeting' : t('meetings.addMeeting')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update meeting details' : 'Schedule a new meeting'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meeting Type */}
          <div className="space-y-2">
            <Label>Meeting Type *</Label>
            <Select
              value={formData.meeting_type}
              onValueChange={(value) => setFormData({ ...formData, meeting_type: value as MeetingType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_on_one">{t('meetings.oneOnOne')}</SelectItem>
                <SelectItem value="team">{t('meetings.team')}</SelectItem>
                <SelectItem value="ministry">{t('nav.ministries')}</SelectItem>
                <SelectItem value="board">{t('meetings.board')}</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Selection (for new meetings) */}
          {!isEditing && availableTemplates.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Use Template
              </Label>
              <Select
                value={selectedTemplateId || 'none'}
                onValueChange={(value) => setSelectedTemplateId(value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {availableTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {getLocalizedField(template, 'name')}
                      {template.is_default && ' (Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplateId && (
                <p className="text-xs text-muted-foreground">
                  {templates?.find(t => t.id === selectedTemplateId)?.items?.length || 0} agenda items will be added
                </p>
              )}
            </div>
          )}

          {/* Person Focus (for 1:1s) */}
          {formData.meeting_type === 'one_on_one' && (
            <div className="space-y-2">
              <Label>Meeting with (Direct Report) *</Label>
              <Select
                value={formData.person_focus_id}
                onValueChange={(value) => setFormData({ ...formData, person_focus_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {directReports.length > 0 ? (
                    directReports.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))
                  ) : (
                    people?.filter(p => p.id !== person?.id).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title_en">Title (English) *</Label>
              <Input
                id="title_en"
                value={formData.title_en}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                placeholder="Meeting title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title_fr">Title (Français)</Label>
              <Input
                id="title_fr"
                value={formData.title_fr}
                onChange={(e) => setFormData({ ...formData, title_fr: e.target.value })}
                placeholder="Titre de la réunion"
              />
            </div>
          </div>

          {/* Date and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formData.date_time}
                onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                required
              />
              {isCheckingConflicts && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking availability...
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Select
                value={formData.duration_minutes.toString()}
                onValueChange={(value) => setFormData({ ...formData, duration_minutes: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conflict Warning */}
          {conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {formatConflictMessage(conflicts)}
              </AlertDescription>
            </Alert>
          )}

          {/* Organizer and Ministry */}
          <div className={`grid gap-4 ${formData.meeting_type === 'one_on_one' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="space-y-2">
              <Label>Organizer *</Label>
              <Select
                value={formData.organizer_id}
                onValueChange={(value) => setFormData({ ...formData, organizer_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organizer" />
                </SelectTrigger>
                <SelectContent>
                  {people?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.meeting_type !== 'one_on_one' && (
              <div className="space-y-2">
                <Label>Ministry (optional)</Label>
                <Select
                  value={formData.ministry_id}
                  onValueChange={(value) => setFormData({ ...formData, ministry_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ministry" />
                  </SelectTrigger>
                  <SelectContent>
                    {ministries?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="recurrence">Recurrence Pattern</Label>
              <Select
                value={formData.recurrence_pattern || 'none'}
                onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No recurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No recurrence</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Reschedule Conflicts Dialog */}
      <RescheduleConflictsDialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        conflicts={conflicts}
        proposedDateTime={new Date(formData.date_time)}
        proposedDuration={formData.duration_minutes}
        personIds={getPersonIdsForConflictCheck()}
        onProceedAnyway={proceedWithSave}
        onRescheduled={handleRescheduled}
      />
    </Dialog>
  );
}
